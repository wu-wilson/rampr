import { Pool, QueryResult } from 'pg';

import { config } from './config';

/** Single shared connection pool. The cron is a short-lived one-shot, so `max: 1` suffices. */
// Pin the session to UTC so the CURRENT_DATE retention boundary matches the poller's snapshot dates.
const pool = new Pool({ connectionString: config.databaseUrl, max: 1, options: '-c timezone=UTC' });

/**
 * Run a parameterized query against the pool.
 * @param text - SQL with `$1`, `$2`, ... placeholders; never interpolate input
 * @param params - Values bound to the placeholders, in order
 * @returns The unwrapped driver result; read `.rows` for the selected records
 */
async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  return pool.query(text, params);
}

/**
 * Prune `daily_snapshots` rows older than the retention window, keeping the rolling
 * `retentionDays`-day history that the trajectory and market-index charts render. Deletes any
 * row whose `snapshot_date` predates `CURRENT_DATE - retentionDays`; `CURRENT_DATE` is UTC to
 * match the poller's snapshot dates, so the boundary is stable across timezones.
 * @param retentionDays - Number of days of history to keep; older snapshots are removed
 * @returns The count of `daily_snapshots` rows deleted (`0` when nothing is past the window)
 */
export async function deleteOldSnapshots(retentionDays: number): Promise<number> {
  const result = await query(
    'DELETE FROM daily_snapshots WHERE snapshot_date < CURRENT_DATE - $1::int',
    [retentionDays],
  );
  return result.rowCount ?? 0;
}

/**
 * Close the connection pool. Call once at process shutdown.
 * @returns Resolves once the pool has drained
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
