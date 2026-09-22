import { changeSince } from './board';
import { query, toNullableInt } from './db';

import { GATING_DAYS, TREND_WINDOW_DAYS } from '../constants';

/** The ATS providers rampr polls (mirrors the `ats_provider` check constraint). */
type AtsSource = 'greenhouse' | 'lever' | 'ashby';

/** Identity + standing for a single company. */
interface CompanyProfile {
  name: string;
  /** Human sector label. */
  sectorLabel: string;
  /** Global position by open-role count across all companies (1 = most open roles). */
  rank: number;
  /** Companies tracked in all, the denominator for `rank`. */
  companyCount: number;
  /** Position by open-role count within the company's sector (1 = most open roles in the sector). */
  sectorRank: number;
  /** Companies tracked in the same sector, the denominator for `sectorRank`. */
  sectorCompanyCount: number;
  /** Live open roles across the whole sector, the denominator for the company's share of it. */
  sectorOpen: number;
  /** Date tracking began (`YYYY-MM-DD`). */
  trackedSince: string;
  /** Link to the company's own board, or `null` when unknown. */
  careersUrl: string | null;
  /** The ATS the company is polled from. */
  source: AtsSource;
}

/** One row of a department/location breakdown. */
interface BreakdownEntry {
  /** Department or location label; `'Unknown'` when the source field is null. */
  name: string;
  count: number;
}

/** One slice of the remote/hybrid/onsite/unknown work mix. */
interface WorkMixSlice {
  /** Integer percent of open roles. */
  pct: number;
  count: number;
}

/** Shares of open roles by work arrangement; `unknown` is a residual slice. */
interface WorkMix {
  remote: WorkMixSlice;
  hybrid: WorkMixSlice;
  onsite: WorkMixSlice;
  unknown: WorkMixSlice;
}

/** Live department, location, and work-mix breakdowns — always sum to `open`. */
interface Breakdowns {
  departments: BreakdownEntry[];
  locations: BreakdownEntry[];
  workMix: WorkMix;
}

/** One point on the company's open-count trajectory. */
interface TrajectoryPoint {
  /** Snapshot date (`YYYY-MM-DD`). */
  date: string;
  /** Open-role count on that date. */
  count: number;
}

/** The company's open-count time series (the last 90 days); empty while gated. */
interface Trajectory {
  gated: boolean;
  daysTracked: number;
  points: TrajectoryPoint[];
}

/** Response body for `GET /api/companies/:slug`. */
export interface CompanyResponse {
  company: CompanyProfile;
  /** Live open-role count (`COUNT(listings)`). */
  open: number;
  /** Signed change vs. the snapshot on or before 7 days before the latest release; `null` when gated or no such snapshot exists. */
  delta7d: number | null;
  breakdowns: Breakdowns;
  trajectory: Trajectory;
}

/** Map a raw `GROUP BY` breakdown row to a `BreakdownEntry`. */
function toBreakdownEntry(row: Record<string, unknown>): BreakdownEntry {
  return { name: String(row.name), count: Number(row.count) };
}

/** Build a single work-mix slice as a share of the company's open roles. */
function toWorkMixSlice(count: number, total: number): WorkMixSlice {
  return { pct: total > 0 ? Math.round((count * 100) / total) : 0, count };
}

/**
 * Load a company's full detail: profile and ranks, the live open count and breakdowns from
 * `listings`, and the 7-day change and gated trajectory from `daily_snapshots`.
 * @param slug - The company slug from the route param
 * @returns The full response body, or `null` when no company has that slug (the route maps `null` to 404)
 */
export async function getCompany(slug: string): Promise<CompanyResponse | null> {
  const baseResult = await query(
    `WITH open_counts AS (
       SELECT c.id, c.name, COUNT(l.id) AS open_now
         FROM companies c
         LEFT JOIN listings l ON l.company_id = c.id
        GROUP BY c.id
     ),
     ranked AS (
       SELECT oc.id,
              oc.open_now::int AS open_now,
              (ROW_NUMBER() OVER (ORDER BY oc.open_now DESC, oc.name ASC, c.slug ASC))::int AS rank,
              (ROW_NUMBER() OVER (PARTITION BY c.sector_slug ORDER BY oc.open_now DESC, oc.name ASC, c.slug ASC))::int AS sector_rank,
              (COUNT(*) OVER (PARTITION BY c.sector_slug))::int AS sector_company_count,
              (SUM(oc.open_now) OVER (PARTITION BY c.sector_slug))::int AS sector_open
         FROM open_counts oc
         JOIN companies c ON c.id = oc.id
     )
     SELECT
       c.id,
       c.name,
       s.label AS sector_label,
       c.careers_url,
       c.ats_provider,
       to_char(c.tracked_since, 'YYYY-MM-DD') AS tracked_since,
       r.rank,
       (SELECT COUNT(*)::int FROM companies) AS company_count,
       r.sector_rank,
       r.sector_company_count,
       r.sector_open,
       r.open_now,
       (SELECT COUNT(*)::int FROM daily_snapshots WHERE company_id = c.id) AS days_tracked,
       (SELECT open_count FROM daily_snapshots
          WHERE company_id = c.id AND snapshot_date <= (SELECT MAX(snapshot_date) FROM daily_snapshots) - 7
          ORDER BY snapshot_date DESC LIMIT 1) AS prior_open
     FROM companies c
     JOIN sectors s ON s.slug = c.sector_slug
     JOIN ranked r ON r.id = c.id
     WHERE c.slug = $1`,
    [slug],
  );

  if (baseResult.rows.length === 0) {
    return null;
  }
  const base = baseResult.rows[0] as Record<string, unknown>;
  const companyId = Number(base.id);
  const open = Number(base.open_now);
  const daysTracked = Number(base.days_tracked);
  const gated = daysTracked < GATING_DAYS;

  const [departmentsResult, locationsResult, workMixResult, trajectoryResult] = await Promise.all([
    query(
      `SELECT COALESCE(department, 'Unknown') AS name, COUNT(*)::int AS count
         FROM listings
        WHERE company_id = $1
        GROUP BY COALESCE(department, 'Unknown')
        ORDER BY count DESC, name ASC`,
      [companyId],
    ),
    query(
      `SELECT COALESCE(location, 'Unknown') AS name, COUNT(*)::int AS count
         FROM listings
        WHERE company_id = $1
        GROUP BY COALESCE(location, 'Unknown')
        ORDER BY count DESC, name ASC`,
      [companyId],
    ),
    query(
      `SELECT
         COUNT(*) FILTER (WHERE remote_type = 'remote')::int  AS remote,
         COUNT(*) FILTER (WHERE remote_type = 'hybrid')::int  AS hybrid,
         COUNT(*) FILTER (WHERE remote_type = 'onsite')::int  AS onsite,
         COUNT(*) FILTER (WHERE remote_type = 'unknown')::int AS unknown
       FROM listings
       WHERE company_id = $1`,
      [companyId],
    ),
    gated
      ? null
      : query(
          `SELECT to_char(snapshot_date, 'YYYY-MM-DD') AS date, open_count AS count
             FROM daily_snapshots
            WHERE company_id = $1 AND snapshot_date > (SELECT MAX(snapshot_date) FROM daily_snapshots) - $2::int
            ORDER BY snapshot_date ASC`,
          [companyId, TREND_WINDOW_DAYS],
        ),
  ]);

  const mixRow = workMixResult.rows[0] as Record<string, unknown>;
  const remote = Number(mixRow.remote);
  const hybrid = Number(mixRow.hybrid);
  const onsite = Number(mixRow.onsite);
  const unknown = Number(mixRow.unknown);

  const trajectory: Trajectory = {
    gated,
    daysTracked,
    points: trajectoryResult
      ? (trajectoryResult.rows as Record<string, unknown>[]).map((row) => ({
          date: String(row.date),
          count: Number(row.count),
        }))
      : [],
  };

  const response: CompanyResponse = {
    company: {
      name: String(base.name),
      sectorLabel: String(base.sector_label),
      rank: Number(base.rank),
      companyCount: Number(base.company_count),
      sectorRank: Number(base.sector_rank),
      sectorCompanyCount: Number(base.sector_company_count),
      sectorOpen: Number(base.sector_open),
      trackedSince: String(base.tracked_since),
      careersUrl: base.careers_url === null ? null : String(base.careers_url),
      // `ats_provider` is DB-constrained to the provider enum, so the union narrowing is safe.
      source: String(base.ats_provider) as AtsSource,
    },
    open,
    delta7d: changeSince(open, toNullableInt(base.prior_open), daysTracked),
    breakdowns: {
      departments: (departmentsResult.rows as Record<string, unknown>[]).map(toBreakdownEntry),
      locations: (locationsResult.rows as Record<string, unknown>[]).map(toBreakdownEntry),
      workMix: {
        remote: toWorkMixSlice(remote, open),
        hybrid: toWorkMixSlice(hybrid, open),
        onsite: toWorkMixSlice(onsite, open),
        unknown: toWorkMixSlice(unknown, open),
      },
    },
    trajectory,
  };

  return response;
}
