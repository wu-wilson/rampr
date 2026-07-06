import { query } from './db';

/** Response body for `GET /api/meta`. */
export interface MetaResponse {
  /** `MAX(snapshot_date)` as `YYYY-MM-DD`, or `null` before the first poll (client day-zero). */
  updatedAt: string | null;
}

/**
 * Read the last-updated stamp that drives the nav's "updated {date}" line and the day-zero state.
 * @returns The `GET /api/meta` response body
 */
export async function getMeta(): Promise<MetaResponse> {
  const result = await query(
    `SELECT to_char(MAX(snapshot_date), 'YYYY-MM-DD') AS updated_at FROM daily_snapshots`,
  );
  const row = result.rows[0] as Record<string, unknown>;

  const response: MetaResponse = {
    updatedAt: row.updated_at === null ? null : String(row.updated_at),
  };

  console.log(`Meta served: updatedAt ${response.updatedAt ?? 'none'}`);
  return response;
}
