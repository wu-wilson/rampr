import { runCleanup } from './cleanup';
import { closePool } from './db';

/**
 * Run one retention cleanup pass and exit.
 *
 * Boots, prunes `daily_snapshots` older than the retention window, logs the deleted count, and
 * exits. Models the one-shot cron pattern: exits 1 only on a fatal DB/connection failure, 0
 * otherwise. `DATABASE_URL` defaults to the local dev URL so a misconfigured production env
 * surfaces as a connection error rather than a silent no-op.
 */
async function main(): Promise<void> {
  let exitCode = 0;

  try {
    const result = await runCleanup();
    console.log(`Cleanup complete: ${result.snapshotsDeleted} snapshot(s) deleted`);
  } catch (err) {
    console.error('Cleanup failed:', err);
    exitCode = 1;
  } finally {
    await closePool();
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('Cleanup crashed:', err);
  process.exit(1);
});
