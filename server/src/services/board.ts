import { query, toNullableInt } from './db';

import { GATING_DAYS, TREND_WINDOW_DAYS } from '../constants';

/** How many of the largest boards the concentration share covers. */
const TOP_SHARE_COUNT = 10;

/** One figure per trailing window; each `null` while globally gated or without a prior snapshot. */
interface WindowFigures {
  day1: number | null;
  day7: number | null;
  day30: number | null;
  day90: number | null;
}

/** Every window `null`, for a gated market. */
const NO_WINDOWS: WindowFigures = { day1: null, day7: null, day30: null, day90: null };

/** The market lead above the company table. */
interface BoardMarket {
  /** Live total open roles across all tracked companies (`COUNT(listings)`). */
  totalOpen: number;
  companyCount: number;
  /** Signed market-wide change over each window. */
  changes: WindowFigures;
  /** The prior total each change is measured from, over the same boards, so its percentage is of what those boards had. */
  changeBases: WindowFigures;
  /** Companies with `GATING_DAYS` snapshots and open roles whose live count equals or beats every snapshot in the last 90 days; `null` while globally gated. */
  atHigh90: number | null;
  /** Share of all open roles held by the ten largest boards, as an integer percent; live from day one. */
  topTenShare: number;
}

/** One row of the company table. */
interface BoardCompany {
  /** Position by open-role count across all companies (1 = most open roles). */
  rank: number;
  slug: string;
  name: string;
  /** Sector slug (the table's filter value). */
  sector: string;
  /** Human sector label. */
  sectorLabel: string;
  /** Live open-role count. */
  open: number;
  /** Signed change vs. the snapshot on or before 7 days before the latest release; `null` only while gated, since a company past the gate always has that snapshot. */
  delta7d: number | null;
  /** Signed change vs. the snapshot on or before 30 days before the latest release; `null` when gated or no such snapshot exists. */
  delta30d: number | null;
}

/** Response body for `GET /api/board`. */
export interface BoardResponse {
  market: BoardMarket;
  companies: BoardCompany[];
  /** `MAX(snapshot_date)` as `YYYY-MM-DD`, or `null` before the first poll. */
  updatedAt: string | null;
}

/**
 * A company's signed change from a prior snapshot, gated per company.
 * @param openNow - Live open-role count (`COUNT(listings)`)
 * @param priorOpen - `open_count` of the most recent snapshot on or before the window start, or `null` if none
 * @param daysTracked - Count of daily snapshots recorded for the company
 * @returns The change, or `null` while the company has fewer than `GATING_DAYS` snapshots or lacks a prior
 */
export function changeSince(openNow: number, priorOpen: number | null, daysTracked: number): number | null {
  return daysTracked < GATING_DAYS || priorOpen === null ? null : openNow - priorOpen;
}

/** Map a raw enriched board row to a `BoardCompany`. */
function toBoardCompany(row: Record<string, unknown>): BoardCompany {
  const open = Number(row.open_now);
  const daysTracked = Number(row.days_tracked);
  return {
    rank: Number(row.rank),
    slug: String(row.slug),
    name: String(row.name),
    sector: String(row.sector_slug),
    sectorLabel: String(row.sector_label),
    open,
    delta7d: changeSince(open, toNullableInt(row.prior_open_7), daysTracked),
    delta30d: changeSince(open, toNullableInt(row.prior_open_30), daysTracked),
  };
}

/** The market-wide change over each window and the prior total it's measured from, counted back from the latest release and summed only over companies whose own change is live, so a board added mid-window never reads as growth. */
async function marketChanges(): Promise<Pick<BoardMarket, 'changes' | 'changeBases'>> {
  const result = await query(
    `WITH windows AS (
       SELECT unnest($1::int[]) AS days
     ),
     prior AS (
       SELECT DISTINCT ON (w.days, s.company_id) w.days, s.company_id, s.open_count AS prior_open
         FROM windows w
         JOIN daily_snapshots s ON s.snapshot_date <= (SELECT MAX(snapshot_date) FROM daily_snapshots) - w.days
        ORDER BY w.days, s.company_id, s.snapshot_date DESC
     ),
     tracked AS (
       SELECT company_id FROM daily_snapshots GROUP BY company_id HAVING COUNT(*) >= $2
     ),
     live AS (
       SELECT c.id, COUNT(l.id)::int AS open_now
         FROM companies c
         LEFT JOIN listings l ON l.company_id = c.id
        GROUP BY c.id
     )
     SELECT prior.days, SUM(live.open_now - prior.prior_open)::int AS delta, SUM(prior.prior_open)::int AS base
       FROM prior
       JOIN tracked ON tracked.company_id = prior.company_id
       JOIN live ON live.id = prior.company_id
      GROUP BY prior.days`,
    [[1, 7, 30, 90], GATING_DAYS],
  );
  const rows = new Map(result.rows.map((row) => [Number(row.days), row]));
  const windows = (column: 'delta' | 'base'): WindowFigures => {
    const over = (days: number): number | null => toNullableInt(rows.get(days)?.[column]);
    return { day1: over(1), day7: over(7), day30: over(30), day90: over(90) };
  };
  return { changes: windows('delta'), changeBases: windows('base') };
}

/**
 * Build the board: the market lead, the ranked company table, and the `updatedAt` stamp.
 * @param limit - The most companies to return, by rank
 * @returns The full `GET /api/board` response body
 */
export async function getBoard(limit: number): Promise<BoardResponse> {
  const marketResult = await query(
    `WITH open_counts AS (
       SELECT c.id, COUNT(l.id)::int AS open_now
         FROM companies c
         LEFT JOIN listings l ON l.company_id = c.id
        GROUP BY c.id
     ),
     highs AS (
       SELECT company_id, MAX(open_count) AS high_90
         FROM daily_snapshots
        WHERE snapshot_date > (SELECT MAX(snapshot_date) FROM daily_snapshots) - $1::int
        GROUP BY company_id
     ),
     days AS (
       SELECT company_id, COUNT(*) AS days_tracked
         FROM daily_snapshots
        GROUP BY company_id
     )
     SELECT
       (SELECT COUNT(*)::int FROM listings)                              AS total_open,
       (SELECT COUNT(*)::int FROM companies)                            AS company_count,
       (SELECT COUNT(DISTINCT snapshot_date)::int FROM daily_snapshots) AS distinct_days,
       to_char((SELECT MAX(snapshot_date) FROM daily_snapshots), 'YYYY-MM-DD') AS updated_at,
       (SELECT COUNT(*)::int
          FROM open_counts oc
          JOIN highs h ON h.company_id = oc.id
          JOIN days d ON d.company_id = oc.id AND d.days_tracked >= $2
         WHERE oc.open_now > 0 AND oc.open_now >= h.high_90)             AS at_high_90,
       (SELECT COALESCE(SUM(open_now), 0)::int
          FROM (SELECT open_now FROM open_counts ORDER BY open_now DESC LIMIT $3) top) AS top_open`,
    [TREND_WINDOW_DAYS, GATING_DAYS, TOP_SHARE_COUNT],
  );

  const rowsResult = await query(
    `WITH open_counts AS (
       SELECT c.id, c.slug, c.name, c.sector_slug, COUNT(l.id) AS open_now
         FROM companies c
         LEFT JOIN listings l ON l.company_id = c.id
        GROUP BY c.id
     ),
     days AS (
       SELECT company_id, COUNT(*) AS days_tracked
         FROM daily_snapshots
        GROUP BY company_id
     ),
     prior_7 AS (
       SELECT DISTINCT ON (company_id) company_id, open_count AS prior_open_7
         FROM daily_snapshots
        WHERE snapshot_date <= (SELECT MAX(snapshot_date) FROM daily_snapshots) - 7
        ORDER BY company_id, snapshot_date DESC
     ),
     prior_30 AS (
       SELECT DISTINCT ON (company_id) company_id, open_count AS prior_open_30
         FROM daily_snapshots
        WHERE snapshot_date <= (SELECT MAX(snapshot_date) FROM daily_snapshots) - 30
        ORDER BY company_id, snapshot_date DESC
     )
     SELECT
       oc.slug,
       oc.name,
       oc.sector_slug,
       oc.open_now::int AS open_now,
       s.label          AS sector_label,
       COALESCE(d.days_tracked, 0)::int AS days_tracked,
       p7.prior_open_7,
       p30.prior_open_30,
       (ROW_NUMBER() OVER (ORDER BY oc.open_now DESC, oc.name ASC, oc.slug ASC))::int AS rank
     FROM open_counts oc
     JOIN sectors s ON s.slug = oc.sector_slug
     LEFT JOIN days d ON d.company_id = oc.id
     LEFT JOIN prior_7 p7 ON p7.company_id = oc.id
     LEFT JOIN prior_30 p30 ON p30.company_id = oc.id
     ORDER BY rank
     LIMIT $1`,
    [limit],
  );
  const marketRow = marketResult.rows[0];

  const totalOpen = Number(marketRow.total_open);
  const marketGated = Number(marketRow.distinct_days) < GATING_DAYS;
  const { changes, changeBases } = marketGated ? { changes: NO_WINDOWS, changeBases: NO_WINDOWS } : await marketChanges();
  const market: BoardMarket = {
    totalOpen,
    companyCount: Number(marketRow.company_count),
    changes,
    changeBases,
    atHigh90: marketGated ? null : Number(marketRow.at_high_90),
    topTenShare: totalOpen > 0 ? Math.round((Number(marketRow.top_open) * 100) / totalOpen) : 0,
  };
  const updatedAt = marketRow.updated_at === null ? null : String(marketRow.updated_at);

  const companies = rowsResult.rows.map(toBoardCompany);

  return { market, companies, updatedAt };
}
