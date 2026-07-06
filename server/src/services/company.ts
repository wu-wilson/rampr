import { resolveMomentum } from './board';
import { query } from './db';

import { GATING_DAYS } from '../constants';

import type { MomentumSummary } from './board';

/** The ATS providers rampr polls (mirrors the `ats_provider` check constraint). */
type AtsSource = 'greenhouse' | 'lever' | 'ashby';

/** Identity + standing for a single company. */
interface CompanyProfile {
  slug: string;
  name: string;
  /** Sector slug. */
  sector: string;
  /** Human sector label. */
  sectorLabel: string;
  /** Global position by open-role count across all companies (1 = most open roles). */
  rank: number;
  /** Date tracking began (`YYYY-MM-DD`). */
  trackedSince: string;
  /** "View roles" link to the company's own board, or `null` when unknown. */
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

/** The company's open-count time series (up to 90 days); empty while gated. */
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
  momentum: MomentumSummary;
  breakdowns: Breakdowns;
  trajectory: Trajectory;
}

/** Trajectory window depth in days — the deepest the chart ever renders (matches cleanup retention). */
const TRAJECTORY_WINDOW_DAYS = 90;

/** Coerce a nullable numeric pg column (integer or `null`) to `number | null`. */
function toNullableInt(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

/**
 * Map a raw `GROUP BY` breakdown row to a `BreakdownEntry`.
 * @param row - Raw pg row with `name` + `count` columns
 * @returns One breakdown entry
 */
function toBreakdownEntry(row: Record<string, unknown>): BreakdownEntry {
  return { name: String(row.name), count: Number(row.count) };
}

/**
 * Build a single work-mix slice as a share of the company's open roles.
 * @param count - Open roles with this work arrangement
 * @param total - Total open roles (the denominator)
 * @returns The slice with an integer percent (0 when `total` is 0)
 */
function toWorkMixSlice(count: number, total: number): WorkMixSlice {
  return { pct: total > 0 ? Math.round((count / total) * 100) : 0, count };
}

/**
 * Load a company's full detail: profile + rank, live open count + momentum, department/location/work-mix
 * breakdowns, and the (per-company gated) open-count trajectory.
 *
 * Open count and breakdowns come live from `listings` (same rows, so the breakdowns sum to `open`);
 * rank is the global position by open count; momentum and trajectory derive from `daily_snapshots`.
 * @param slug - The company slug from the route param
 * @returns The full response body, or `null` when no company has that slug (the route maps `null` to 404)
 */
export async function getCompany(slug: string): Promise<CompanyResponse | null> {
  const baseResult = await query(
    `WITH open_counts AS (
       SELECT c.id, c.name, COUNT(l.id) AS open_now
         FROM companies c
         LEFT JOIN listings l ON l.company_id = c.id
        GROUP BY c.id, c.name
     ),
     ranked AS (
       SELECT id, (ROW_NUMBER() OVER (ORDER BY open_now DESC, name ASC))::int AS rank
         FROM open_counts
     )
     SELECT
       c.id,
       c.slug,
       c.name,
       c.sector_slug,
       s.label AS sector_label,
       c.careers_url,
       c.ats_provider,
       to_char(c.tracked_since, 'YYYY-MM-DD') AS tracked_since,
       r.rank,
       (SELECT COUNT(*)::int FROM listings WHERE company_id = c.id) AS open_now,
       (SELECT COUNT(*)::int FROM daily_snapshots WHERE company_id = c.id) AS days_tracked,
       (SELECT open_count FROM daily_snapshots
          WHERE company_id = c.id AND snapshot_date <= CURRENT_DATE - 7
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
    query(
      `SELECT to_char(snapshot_date, 'YYYY-MM-DD') AS date, open_count AS count
         FROM daily_snapshots
        WHERE company_id = $1 AND snapshot_date >= CURRENT_DATE - $2::int
        ORDER BY snapshot_date ASC`,
      [companyId, TRAJECTORY_WINDOW_DAYS],
    ),
  ]);

  const mixRow = workMixResult.rows[0] as Record<string, unknown>;
  const remote = Number(mixRow.remote);
  const hybrid = Number(mixRow.hybrid);
  const onsite = Number(mixRow.onsite);
  const unknown = Number(mixRow.unknown);

  const gated = daysTracked < GATING_DAYS;
  const trajectory: Trajectory = {
    gated,
    daysTracked,
    points: gated
      ? []
      : (trajectoryResult.rows as Record<string, unknown>[]).map((row) => ({
          date: String(row.date),
          count: Number(row.count),
        })),
  };

  const response: CompanyResponse = {
    company: {
      slug: String(base.slug),
      name: String(base.name),
      sector: String(base.sector_slug),
      sectorLabel: String(base.sector_label),
      rank: Number(base.rank),
      trackedSince: String(base.tracked_since),
      careersUrl: base.careers_url === null ? null : String(base.careers_url),
      source: String(base.ats_provider) as AtsSource,
    },
    open,
    momentum: resolveMomentum(open, toNullableInt(base.prior_open), daysTracked),
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

  console.log(`Company served: ${response.company.slug} (open ${open}, rank ${response.company.rank})`);
  return response;
}
