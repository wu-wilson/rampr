import { query } from './db';

import { GATING_DAYS } from '../constants';

/** How many heating and cooling movers to surface on each side. */
const MOVERS_LIMIT = 5;

/** Trend window depth in days — the deepest the market index chart ever renders. */
const INDEX_WINDOW_DAYS = 90;

/** Top-line market figures. */
interface MarketTotals {
  /** Live total open roles across all companies (`COUNT(listings)`). */
  totalOpen: number;
  companyCount: number;
  sectorCount: number;
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
}

/** One point on the market hiring index. */
interface IndexPoint {
  /** Snapshot date (`YYYY-MM-DD`). */
  date: string;
  /** `SUM(open_count)` across all companies on that date. */
  totalOpen: number;
}

/** The market hiring index time series (up to 90 days); empty while globally gated. */
interface MarketIndex {
  gated: boolean;
  daysTracked: number;
  points: IndexPoint[];
}

/** A company whose open count moved most over the last 7 days. */
interface Mover {
  slug: string;
  name: string;
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
  movers: Movers;
}

/**
 * Map a raw mover row to the `Mover` contract.
 * @param row - Raw pg row with `slug`, `name`, `delta` columns
 * @returns One mover entry
 */
function toMover(row: Record<string, unknown>): Mover {
  return { slug: String(row.slug), name: String(row.name), delta: Number(row.delta) };
}

/**
 * Build the market view: live totals + per-sector open counts (never gated), and the two globally
 * gated trend surfaces — the market hiring index and the heating/cooling movers.
 *
 * Sector totals come live from `listings`; the index and movers derive from `daily_snapshots` and are
 * suppressed (empty `points` / arrays with `gated: true`) until `GATING_DAYS` distinct snapshot dates exist.
 * @returns The full `GET /api/market` response body
 */
export async function getMarket(): Promise<MarketResponse> {
  const totalsResult = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM listings)                            AS total_open,
       (SELECT COUNT(*)::int FROM companies)                          AS company_count,
       (SELECT COUNT(*)::int FROM sectors)                            AS sector_count,
       (SELECT COUNT(DISTINCT snapshot_date)::int FROM daily_snapshots) AS distinct_days,
       to_char((SELECT MAX(snapshot_date) FROM daily_snapshots), 'YYYY-MM-DD') AS updated_at`,
  );
  const totalsRow = totalsResult.rows[0] as Record<string, unknown>;
  const distinctDays = Number(totalsRow.distinct_days);
  const gated = distinctDays < GATING_DAYS;

  const totals: MarketTotals = {
    totalOpen: Number(totalsRow.total_open),
    companyCount: Number(totalsRow.company_count),
    sectorCount: Number(totalsRow.sector_count),
    updatedAt: totalsRow.updated_at === null ? null : String(totalsRow.updated_at),
  };

  const sectorsResult = await query(
    `WITH sector_open AS (
       SELECT s.slug, s.label, s.sort_order, COUNT(l.id)::int AS open
         FROM sectors s
         LEFT JOIN companies c ON c.sector_slug = s.slug
         LEFT JOIN listings l ON l.company_id = c.id
        GROUP BY s.slug, s.label, s.sort_order
     )
     SELECT
       slug,
       label,
       open,
       CASE WHEN MAX(open) OVER () > 0
            THEN ROUND(open::numeric / MAX(open) OVER () * 100)::int
            ELSE 0 END AS pct
     FROM sector_open
     ORDER BY open DESC, sort_order ASC`,
  );
  const sectors: SectorTotal[] = (sectorsResult.rows as Record<string, unknown>[]).map((row) => ({
    slug: String(row.slug),
    label: String(row.label),
    open: Number(row.open),
    pct: Number(row.pct),
  }));

  const index: MarketIndex = { gated, daysTracked: distinctDays, points: [] };
  const movers: Movers = { gated, heating: [], cooling: [] };

  if (!gated) {
    const indexResult = await query(
      `SELECT to_char(snapshot_date, 'YYYY-MM-DD') AS date, SUM(open_count)::int AS total_open
         FROM daily_snapshots
        WHERE snapshot_date >= CURRENT_DATE - $1
        GROUP BY snapshot_date
        ORDER BY snapshot_date ASC`,
      [INDEX_WINDOW_DAYS],
    );
    index.points = (indexResult.rows as Record<string, unknown>[]).map((row) => ({
      date: String(row.date),
      totalOpen: Number(row.total_open),
    }));

    const heatingResult = await query(
      `WITH open_now AS (
         SELECT c.id, c.slug, c.name, COUNT(l.id) AS open_now
           FROM companies c
           LEFT JOIN listings l ON l.company_id = c.id
          GROUP BY c.id
       ),
       prior AS (
         SELECT DISTINCT ON (company_id) company_id, open_count AS prior_open
           FROM daily_snapshots
          WHERE snapshot_date <= CURRENT_DATE - 7
          ORDER BY company_id, snapshot_date DESC
       )
       SELECT o.slug, o.name, (o.open_now - p.prior_open)::int AS delta
         FROM open_now o
         JOIN prior p ON p.company_id = o.id
        WHERE (o.open_now - p.prior_open) > 0
        ORDER BY delta DESC, o.name ASC
        LIMIT $1`,
      [MOVERS_LIMIT],
    );
    const coolingResult = await query(
      `WITH open_now AS (
         SELECT c.id, c.slug, c.name, COUNT(l.id) AS open_now
           FROM companies c
           LEFT JOIN listings l ON l.company_id = c.id
          GROUP BY c.id
       ),
       prior AS (
         SELECT DISTINCT ON (company_id) company_id, open_count AS prior_open
           FROM daily_snapshots
          WHERE snapshot_date <= CURRENT_DATE - 7
          ORDER BY company_id, snapshot_date DESC
       )
       SELECT o.slug, o.name, (o.open_now - p.prior_open)::int AS delta
         FROM open_now o
         JOIN prior p ON p.company_id = o.id
        WHERE (o.open_now - p.prior_open) < 0
        ORDER BY delta ASC, o.name ASC
        LIMIT $1`,
      [MOVERS_LIMIT],
    );
    movers.heating = (heatingResult.rows as Record<string, unknown>[]).map(toMover);
    movers.cooling = (coolingResult.rows as Record<string, unknown>[]).map(toMover);
  }

  console.log(`Market served: totalOpen ${totals.totalOpen}, ${sectors.length} sectors, gated ${gated}`);
  return { totals, sectors, index, movers };
}
