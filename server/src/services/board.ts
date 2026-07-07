import { query } from './db';

import { GATING_DAYS } from '../constants';

import type { BoardQuery } from '../schemas/boardQuery';

/** ORDER BY clause per sort key — each carries a stable `name` tiebreak so paging can't skip or dupe. */
const SORT_CLAUSES: Record<BoardQuery['sort'], string> = {
  open: 'open_now DESC, name ASC',
  momentum: 'delta DESC NULLS LAST, open_now DESC, name ASC',
  cooling: 'delta ASC NULLS LAST, open_now DESC, name ASC',
};

/** Momentum direction, computed from the signed 7d delta. */
type MomentumDirection = 'up' | 'down' | 'flat';

/** A company's 7d hiring momentum, shaped for the client. `delta` is `null` when gated or lacking a 7d-ago snapshot. */
export interface MomentumSummary {
  /** Signed change in open roles vs. 7 days ago; `null` when gated or no on-or-before-7d snapshot exists. */
  delta: number | null;
  direction: MomentumDirection;
  /** True while `daysTracked < GATING_DAYS` — the trend is still building. */
  gated: boolean;
}

/** Market headline shown above the board leaderboard. */
interface BoardMarket {
  /** Live total open roles across all tracked companies (`COUNT(listings)`). */
  totalOpen: number;
  companyCount: number;
  sectorCount: number;
  /** Global gating — `true` while `< GATING_DAYS` distinct snapshot dates exist. */
  gated: boolean;
  /** Live total open minus the market index 7 days ago; `null` when globally gated. */
  delta7d: number | null;
}

/** One leaderboard row on the board. */
interface BoardCompany {
  /** Global position by open-role count across all companies (1 = most open roles). */
  rank: number;
  slug: string;
  name: string;
  /** Sector slug (the board filter value). */
  sector: string;
  /** Human sector label. */
  sectorLabel: string;
  /** Live open-role count. */
  open: number;
  /** Remote share as an integer percent of open roles (hybrid excluded). */
  remotePct: number;
  momentum: MomentumSummary;
}

/** Response body for `GET /api/board`. */
export interface BoardResponse {
  market: BoardMarket;
  companies: BoardCompany[];
  /** Count of companies matching `sector`/`q`, for the client's load-more. */
  total: number;
  /** `MAX(snapshot_date)` as `YYYY-MM-DD`, or `null` before the first poll. */
  updatedAt: string | null;
}

/**
 * Derive the momentum direction glyph selector from a signed delta.
 * @param delta - Signed 7d change, or `null` when gated / no 7d-ago snapshot
 * @returns `'up'` when positive, `'down'` when negative, `'flat'` when zero or `null`
 */
function directionOf(delta: number | null): MomentumDirection {
  if (delta === null || delta === 0) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

/**
 * Shape a company's 7d momentum from its live count, 7d-ago snapshot, and history depth.
 * Gating (`daysTracked < GATING_DAYS`) and a missing 7d-ago snapshot both yield a `null` delta.
 * @param openNow - Live open-role count (`COUNT(listings)`)
 * @param priorOpen - `open_count` of the most recent snapshot on-or-before `CURRENT_DATE − 7`, or `null` if none
 * @param daysTracked - Count of daily snapshots recorded for the company
 * @returns The client-facing momentum summary
 */
export function resolveMomentum(
  openNow: number,
  priorOpen: number | null,
  daysTracked: number,
): MomentumSummary {
  const gated = daysTracked < GATING_DAYS;
  const delta = gated || priorOpen === null ? null : openNow - priorOpen;
  return { delta, direction: directionOf(delta), gated };
}

/** Coerce a nullable numeric pg column (integer or `null`) to `number | null`. */
function toNullableInt(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

/**
 * Map a raw enriched board row to a `BoardCompany`, computing remote share and momentum.
 * @param row - Raw pg row from the board query (snake_case columns)
 * @returns One leaderboard row in the client contract
 */
function toBoardCompany(row: Record<string, unknown>): BoardCompany {
  const open = Number(row.open_now);
  const remoteOpen = Number(row.remote_open);
  const remotePct = open > 0 ? Math.round((remoteOpen / open) * 100) : 0;
  const momentum = resolveMomentum(open, toNullableInt(row.prior_open), Number(row.days_tracked));

  return {
    rank: Number(row.rank),
    slug: String(row.slug),
    name: String(row.name),
    sector: String(row.sector_slug),
    sectorLabel: String(row.sector_label),
    open,
    remotePct,
    momentum,
  };
}

/**
 * Build the board leaderboard: the market headline, the ranked + filtered page of companies,
 * the total matching count for load-more, and the `updatedAt` stamp.
 *
 * `open now` and rank come live from `listings` (never the latest snapshot); rank is the global
 * position by open count across all companies and is stable regardless of the applied filter/sort.
 * Momentum is derived from `daily_snapshots` and gated per-company; the market headline's `delta7d`
 * is gated globally.
 * @param params - Validated query params (`sector`, `q`, `sort`, `limit`, `offset`)
 * @returns The full `GET /api/board` response body
 */
export async function getBoard(params: BoardQuery): Promise<BoardResponse> {
  const sector = params.sector ?? null;
  // Escape ILIKE metacharacters so a literal `_`/`%` in the search matches itself, not any-char/any-run.
  const namePattern = params.q ? `%${params.q.replace(/[!%_]/g, (ch) => `!${ch}`)}%` : null;

  const marketResult = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM listings)                            AS total_open,
       (SELECT COUNT(*)::int FROM companies)                          AS company_count,
       (SELECT COUNT(*)::int FROM sectors)                            AS sector_count,
       (SELECT COUNT(DISTINCT snapshot_date)::int FROM daily_snapshots) AS distinct_days,
       (SELECT SUM(open_count)::int
          FROM daily_snapshots
          WHERE snapshot_date = (
            SELECT MAX(snapshot_date) FROM daily_snapshots
            WHERE snapshot_date <= CURRENT_DATE - 7
          )) AS prior_total,
       to_char((SELECT MAX(snapshot_date) FROM daily_snapshots), 'YYYY-MM-DD') AS updated_at`,
  );
  const marketRow = marketResult.rows[0] as Record<string, unknown>;

  const totalOpen = Number(marketRow.total_open);
  const distinctDays = Number(marketRow.distinct_days);
  const priorTotal = toNullableInt(marketRow.prior_total);
  const marketGated = distinctDays < GATING_DAYS;
  const market: BoardMarket = {
    totalOpen,
    companyCount: Number(marketRow.company_count),
    sectorCount: Number(marketRow.sector_count),
    gated: marketGated,
    delta7d: marketGated || priorTotal === null ? null : totalOpen - priorTotal,
  };
  const updatedAt = marketRow.updated_at === null ? null : String(marketRow.updated_at);

  const totalResult = await query(
    `SELECT COUNT(*)::int AS count
       FROM companies
      WHERE ($1::text IS NULL OR sector_slug = $1)
        AND ($2::text IS NULL OR name ILIKE $2 ESCAPE '!')`,
    [sector, namePattern],
  );
  const total = Number((totalResult.rows[0] as Record<string, unknown>).count);

  const pageResult = await query(
    `WITH open_counts AS (
       SELECT c.id, c.slug, c.name, c.sector_slug,
              COUNT(l.id) AS open_now,
              COUNT(l.id) FILTER (WHERE l.remote_type = 'remote') AS remote_open
         FROM companies c
         LEFT JOIN listings l ON l.company_id = c.id
        GROUP BY c.id
     ),
     days AS (
       SELECT company_id, COUNT(*) AS days_tracked
         FROM daily_snapshots
        GROUP BY company_id
     ),
     prior AS (
       SELECT DISTINCT ON (company_id) company_id, open_count AS prior_open
         FROM daily_snapshots
        WHERE snapshot_date <= CURRENT_DATE - 7
        ORDER BY company_id, snapshot_date DESC
     ),
     enriched AS (
       SELECT
         oc.slug,
         oc.name,
         oc.sector_slug,
         oc.open_now::int    AS open_now,
         oc.remote_open::int AS remote_open,
         s.label             AS sector_label,
         COALESCE(d.days_tracked, 0)::int AS days_tracked,
         p.prior_open,
         (ROW_NUMBER() OVER (ORDER BY oc.open_now DESC, oc.name ASC))::int AS rank
       FROM open_counts oc
       JOIN sectors s ON s.slug = oc.sector_slug
       LEFT JOIN days d ON d.company_id = oc.id
       LEFT JOIN prior p ON p.company_id = oc.id
     )
     SELECT
       rank, slug, name, sector_slug, sector_label, open_now, remote_open, days_tracked, prior_open,
       CASE
         WHEN days_tracked >= $1 AND prior_open IS NOT NULL THEN (open_now - prior_open)::int
         ELSE NULL
       END AS delta
     FROM enriched
     WHERE ($2::text IS NULL OR sector_slug = $2)
       AND ($3::text IS NULL OR name ILIKE $3 ESCAPE '!')
     ORDER BY ${SORT_CLAUSES[params.sort]}
     LIMIT $4 OFFSET $5`,
    [GATING_DAYS, sector, namePattern, params.limit, params.offset],
  );

  const companies = (pageResult.rows as Record<string, unknown>[]).map(toBoardCompany);

  console.log(`Board served: ${companies.length} rows (total ${total}, totalOpen ${totalOpen})`);
  return { market, companies, total, updatedAt };
}
