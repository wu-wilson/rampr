import { query } from './db';

import { GATING_DAYS } from '../constants';

/** The ATS sources rampr polls, for the About / methodology surface. */
const SOURCES = ['Greenhouse', 'Lever', 'Ashby'] as const;

/** Response body for `GET /api/meta`. */
export interface MetaResponse {
  /** Live total open roles across all companies (`COUNT(listings)`). */
  totalOpen: number;
  companyCount: number;
  sectorCount: number;
  /** `MAX(snapshot_date)` as `YYYY-MM-DD`, or `null` before the first poll. */
  updatedAt: string | null;
  /** Global gating — `true` while `< GATING_DAYS` distinct snapshot dates exist. */
  gated: boolean;
  /** Count of distinct snapshot dates recorded (the history depth toward gating). */
  daysOfHistory: number;
  /** Human ATS source labels. */
  sources: string[];
}

/**
 * Build the site-wide meta figures: live totals, the last-updated stamp, global gating state,
 * accumulated days of history, and the ATS source list.
 * @returns The full `GET /api/meta` response body
 */
export async function getMeta(): Promise<MetaResponse> {
  const result = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM listings)                            AS total_open,
       (SELECT COUNT(*)::int FROM companies)                          AS company_count,
       (SELECT COUNT(*)::int FROM sectors)                            AS sector_count,
       (SELECT COUNT(DISTINCT snapshot_date)::int FROM daily_snapshots) AS days_of_history,
       to_char((SELECT MAX(snapshot_date) FROM daily_snapshots), 'YYYY-MM-DD') AS updated_at`,
  );
  const row = result.rows[0] as Record<string, unknown>;
  const daysOfHistory = Number(row.days_of_history);

  const response: MetaResponse = {
    totalOpen: Number(row.total_open),
    companyCount: Number(row.company_count),
    sectorCount: Number(row.sector_count),
    updatedAt: row.updated_at === null ? null : String(row.updated_at),
    gated: daysOfHistory < GATING_DAYS,
    daysOfHistory,
    sources: [...SOURCES],
  };

  console.log(`Meta served: totalOpen ${response.totalOpen}, daysOfHistory ${daysOfHistory}`);
  return response;
}
