import { Pool } from 'pg';

import { config } from './config';

/** Single shared connection pool; the cron is a short-lived one-shot, so `max: 1` suffices. */
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 1,
  connectionTimeoutMillis: 5000,
  options: '-c timezone=UTC -c statement_timeout=30000',
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

/**
 * Delete `daily_snapshots` rows more than `retentionDays` plus one day behind the latest release.
 * @param retentionDays - Days of history to keep behind the latest release
 * @returns The count of rows deleted (`0` when nothing is past the window)
 */
export async function deleteOldSnapshots(retentionDays: number): Promise<number> {
  const result = await pool.query(
    'DELETE FROM daily_snapshots WHERE snapshot_date < (SELECT MAX(snapshot_date) FROM daily_snapshots) - ($1::int + 1)',
    [retentionDays],
  );
  return result.rowCount ?? 0;
}

/**
 * Close the connection pool at process shutdown.
 * @returns Resolves once the pool has drained
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
