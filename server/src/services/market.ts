import { query, toNullableInt } from './db';

import { GATING_DAYS, TREND_WINDOW_DAYS } from '../constants';

/** How many heating and cooling movers to surface on each side. */
const MOVERS_LIMIT = 5;

/** Top-line market figures. */
interface MarketTotals {
  /** Live total open roles across all companies (`COUNT(listings)`). */
  totalOpen: number;
  /** `MAX(snapshot_date)` as `YYYY-MM-DD`, or `null` before the first poll. */
  updatedAt: string | null;
}

/** One sector's live open-role total, sized against the largest sector. */
interface SectorTotal {
  slug: string;
  label: string;
  /** Live open roles across the sector's companies. */
  open: number;
  /** Integer percent of the largest sector's open count (the leader is 100). */
  pct: number;
  /** Signed 7-day change summed over the sector's companies whose own change is live; `null` while globally gated or with none. */
  delta7d: number | null;
}

/** One point on the market hiring index. */
interface IndexPoint {
  /** Snapshot date (`YYYY-MM-DD`). */
  date: string;
  /** `SUM(open_count)` across all companies on that date. */
  totalOpen: number;
}

/** The market hiring index time series (the last 90 days); empty while globally gated. */
interface MarketIndex {
  gated: boolean;
  daysTracked: number;
  points: IndexPoint[];
}

/** One release's breadth: how many boards added postings versus removed them since the previous release. */
interface BreadthPoint {
  /** Snapshot date (`YYYY-MM-DD`). */
  date: string;
  /** Companies whose count rose from their previous snapshot. */
  rising: number;
  /** Companies whose count fell from their previous snapshot. */
  falling: number;
}

/** The breadth series (the last 90 days), sharing the index's gate; empty while globally gated. */
interface Breadth {
  points: BreadthPoint[];
}

/** A company whose open count moved most over the last 7 days. */
interface Mover {
  slug: string;
  name: string;
  /** Human sector label. */
  sectorLabel: string;
  /** Signed 7d change in open roles. */
  delta: number;
}

/** Top heating (rising) and cooling (falling) companies; empty while globally gated. */
interface Movers {
  gated: boolean;
  heating: Mover[];
  cooling: Mover[];
}

/** Response body for `GET /api/market`. */
export interface MarketResponse {
  totals: MarketTotals;
  sectors: SectorTotal[];
  index: MarketIndex;
  breadth: Breadth;
  movers: Movers;
}

/** Map a raw mover row to the `Mover` contract. */
function toMover(row: Record<string, unknown>): Mover {
  return {
    slug: String(row.slug),
    name: String(row.name),
    sectorLabel: String(row.sector_label),
    delta: Number(row.delta),
  };
}

/** The largest 7-day moves in one direction among companies whose own change is live. */
async function fetchMovers(direction: 'up' | 'down'): Promise<Mover[]> {
  const result = await query(
    `WITH open_now AS (
       SELECT c.id, c.slug, c.name, s.label AS sector_label, COUNT(l.id) AS open_now
         FROM companies c
         JOIN sectors s ON s.slug = c.sector_slug
         LEFT JOIN listings l ON l.company_id = c.id
        GROUP BY c.id, s.label
     ),
     prior AS (
       SELECT DISTINCT ON (company_id) company_id, open_count AS prior_open
         FROM daily_snapshots
        WHERE snapshot_date <= (SELECT MAX(snapshot_date) FROM daily_snapshots) - 7
        ORDER BY company_id, snapshot_date DESC
     ),
     days AS (
       SELECT company_id, COUNT(*) AS days_tracked
         FROM daily_snapshots
        GROUP BY company_id
     )
     SELECT o.slug, o.name, o.sector_label, (o.open_now - p.prior_open)::int AS delta
       FROM open_now o
       JOIN prior p ON p.company_id = o.id
       JOIN days d ON d.company_id = o.id AND d.days_tracked >= $2
      WHERE (o.open_now - p.prior_open) * $3::int > 0
      ORDER BY (o.open_now - p.prior_open) * $3::int DESC, o.name ASC, o.slug ASC
      LIMIT $1`,
    [MOVERS_LIMIT, GATING_DAYS, direction === 'up' ? 1 : -1],
  );
  return (result.rows as Record<string, unknown>[]).map(toMover);
}

/**
 * Build the market view: live totals and per-sector open counts, then the globally gated trend
 * surfaces (the index, breadth, sector 7-day changes, and movers), all counted back from the
 * latest release. Breadth leaves out a date where no company has a previous snapshot.
 * @returns The full `GET /api/market` response body
 */
export async function getMarket(): Promise<MarketResponse> {
  const [totalsResult, sectorsResult] = await Promise.all([
    query(
      `SELECT
         (SELECT COUNT(*)::int FROM listings)                            AS total_open,
         (SELECT COUNT(DISTINCT snapshot_date)::int FROM daily_snapshots) AS distinct_days,
         to_char((SELECT MAX(snapshot_date) FROM daily_snapshots), 'YYYY-MM-DD') AS updated_at`,
    ),
    query(
      `WITH live AS (
         SELECT c.id, c.sector_slug, COUNT(l.id)::int AS open_now
           FROM companies c
           LEFT JOIN listings l ON l.company_id = c.id
          GROUP BY c.id
       ),
       sector_open AS (
         SELECT s.slug, s.label, s.sort_order, COALESCE(SUM(live.open_now), 0)::int AS open
           FROM sectors s
           LEFT JOIN live ON live.sector_slug = s.slug
          GROUP BY s.slug, s.label, s.sort_order
       ),
       prior AS (
         SELECT DISTINCT ON (company_id) company_id, open_count AS prior_open
           FROM daily_snapshots
          WHERE snapshot_date <= (SELECT MAX(snapshot_date) FROM daily_snapshots) - 7
          ORDER BY company_id, snapshot_date DESC
       ),
       tracked AS (
         SELECT company_id FROM daily_snapshots GROUP BY company_id HAVING COUNT(*) >= $1
       ),
       sector_change AS (
         SELECT live.sector_slug, SUM(live.open_now - p.prior_open)::int AS delta
           FROM prior p
           JOIN tracked ON tracked.company_id = p.company_id
           JOIN live ON live.id = p.company_id
          GROUP BY live.sector_slug
       )
       SELECT
         so.slug,
         so.label,
         so.open,
         CASE WHEN MAX(so.open) OVER () > 0
              THEN ROUND(so.open::numeric / MAX(so.open) OVER () * 100)::int
              ELSE 0 END AS pct,
         sc.delta
       FROM sector_open so
       LEFT JOIN sector_change sc ON sc.sector_slug = so.slug
       ORDER BY so.open DESC, so.sort_order ASC, so.slug ASC`,
      [GATING_DAYS],
    ),
  ]);
  const totalsRow = totalsResult.rows[0] as Record<string, unknown>;
  const distinctDays = Number(totalsRow.distinct_days);
  const gated = distinctDays < GATING_DAYS;

  const totals: MarketTotals = {
    totalOpen: Number(totalsRow.total_open),
    updatedAt: totalsRow.updated_at === null ? null : String(totalsRow.updated_at),
  };

  const sectors: SectorTotal[] = (sectorsResult.rows as Record<string, unknown>[]).map((row) => ({
    slug: String(row.slug),
    label: String(row.label),
    open: Number(row.open),
    pct: Number(row.pct),
    delta7d: gated ? null : toNullableInt(row.delta),
  }));

  const index: MarketIndex = { gated, daysTracked: distinctDays, points: [] };
  const breadth: Breadth = { points: [] };
  const movers: Movers = { gated, heating: [], cooling: [] };

  if (!gated) {
    const [indexResult, breadthResult, heating, cooling] = await Promise.all([
      query(
        `SELECT to_char(snapshot_date, 'YYYY-MM-DD') AS date, SUM(open_count)::int AS total_open
           FROM daily_snapshots
          WHERE snapshot_date > (SELECT MAX(snapshot_date) FROM daily_snapshots) - $1::int
          GROUP BY snapshot_date
          ORDER BY snapshot_date ASC`,
        [TREND_WINDOW_DAYS],
      ),
      query(
        `WITH stepped AS (
           SELECT snapshot_date, open_count,
                  LAG(open_count) OVER (PARTITION BY company_id ORDER BY snapshot_date) AS prev_count
             FROM daily_snapshots
         )
         SELECT to_char(snapshot_date, 'YYYY-MM-DD') AS date,
                COUNT(*) FILTER (WHERE open_count > prev_count)::int AS rising,
                COUNT(*) FILTER (WHERE open_count < prev_count)::int AS falling
           FROM stepped
          WHERE snapshot_date > (SELECT MAX(snapshot_date) FROM daily_snapshots) - $1::int
          GROUP BY snapshot_date
         HAVING COUNT(prev_count) > 0
          ORDER BY snapshot_date ASC`,
        [TREND_WINDOW_DAYS],
      ),
      fetchMovers('up'),
      fetchMovers('down'),
    ]);
    index.points = (indexResult.rows as Record<string, unknown>[]).map((row) => ({
      date: String(row.date),
      totalOpen: Number(row.total_open),
    }));
    breadth.points = (breadthResult.rows as Record<string, unknown>[]).map((row) => ({
      date: String(row.date),
      rising: Number(row.rising),
      falling: Number(row.falling),
    }));
    movers.heating = heating;
    movers.cooling = cooling;
  }

  return { totals, sectors, index, breadth, movers };
}
