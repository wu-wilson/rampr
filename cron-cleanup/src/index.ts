import { config } from './config';
import { closePool, deleteOldSnapshots } from './db';

/** Prune `daily_snapshots` past the retention window and log the deleted count; exits 1 only on a database failure. */
async function main(): Promise<void> {
  let exitCode = 0;

  try {
    const deleted = await deleteOldSnapshots(config.retentionDays);
    console.log(`Cleanup complete: ${deleted} snapshot(s) deleted`);
  } catch (err) {
    console.error('Cleanup failed:', err);
    exitCode = 1;
  } finally {
    try {
      await closePool();
    } catch (err) {
      console.error('Pool close failed:', err);
    }
  }

  process.exitCode = exitCode;
}

main().catch((err) => {
  console.error('Cleanup crashed:', err);
  process.exit(1);
});
