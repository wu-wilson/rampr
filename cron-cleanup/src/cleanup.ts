import { config } from './config';
import { deleteOldSnapshots } from './db';

/** Outcome of a single cleanup run. */
export interface CleanupResult {
  /** Number of `daily_snapshots` rows pruned past the retention window. */
  snapshotsDeleted: number;
}

/**
 * Run one retention pass over `daily_snapshots`: prune every row older than the configured
 * retention window and report how many were removed. The retention depth comes from
 * `config.retentionDays` (default 90), which is exactly the deepest any trend chart renders,
 * so nothing visible is lost.
 * @returns The run outcome, carrying the deleted snapshot count
 */
export async function runCleanup(): Promise<CleanupResult> {
  const snapshotsDeleted = await deleteOldSnapshots(config.retentionDays);
  return { snapshotsDeleted };
}
