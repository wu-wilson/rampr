import { query } from './db';

/** Per-provider counts of tracked boards, for the Method page's sources line. */
interface SourceCounts {
  greenhouse: number;
  lever: number;
  ashby: number;
}

/** Response body for `GET /api/meta`. */
export interface MetaResponse {
  /** `MAX(snapshot_date)` as `YYYY-MM-DD`, or `null` before the first poll (client day-zero). */
  updatedAt: string | null;
  /** The latest release's number (days since the earliest `tracked_since`, plus one), or `null` before the first poll. */
  releaseNumber: number | null;
  /** `MIN(tracked_since)` as `YYYY-MM-DD`: the day the series began, or `null` with no companies seeded. */
  firstRelease: string | null;
  companyCount: number;
  sources: SourceCounts;
}

/**
 * Read the release stamp and the curated-list facts the Method page cites.
 * @returns The `GET /api/meta` response body
 */
export async function getMeta(): Promise<MetaResponse> {
  const result = await query(
    `SELECT
       to_char((SELECT MAX(snapshot_date) FROM daily_snapshots), 'YYYY-MM-DD') AS updated_at,
       to_char((SELECT MIN(tracked_since) FROM companies), 'YYYY-MM-DD')      AS first_release,
       (SELECT (MAX(snapshot_date) - (SELECT MIN(tracked_since) FROM companies) + 1)::int
          FROM daily_snapshots)                                               AS release_number,
       (SELECT COUNT(*)::int FROM companies)                                  AS company_count,
       (SELECT COUNT(*)::int FROM companies WHERE ats_provider = 'greenhouse') AS greenhouse,
       (SELECT COUNT(*)::int FROM companies WHERE ats_provider = 'lever')      AS lever,
       (SELECT COUNT(*)::int FROM companies WHERE ats_provider = 'ashby')      AS ashby`,
  );
  const row = result.rows[0];

  const response: MetaResponse = {
    updatedAt: row.updated_at === null ? null : String(row.updated_at),
    releaseNumber: row.release_number === null ? null : Number(row.release_number),
    firstRelease: row.first_release === null ? null : String(row.first_release),
    companyCount: Number(row.company_count),
    sources: {
      greenhouse: Number(row.greenhouse),
      lever: Number(row.lever),
      ashby: Number(row.ashby),
    },
  };

  return response;
}
