import { closePool } from './db';
import { runPoll } from './poll';

/**
 * Run one full poll and exit.
 *
 * Boots, polls every curated company (per-company feed-fetch failures are isolated and
 * counted as skipped — never fatal), logs the run totals, and
 * exits. A one-shot: exits 1 only on a fatal failure (loading companies / the DB
 * connection), 0 otherwise. `DATABASE_URL` defaults to the local dev URL so a
 * misconfigured production env surfaces as a connection error rather than a silent no-op.
 */
async function main(): Promise<void> {
  let exitCode = 0;

  try {
    const totals = await runPoll();
    console.log(
      `Poll complete: ${totals.companiesPolled} polled, ` +
        `${totals.listingsSeen} listings seen, ${totals.skipped} skipped`,
    );
  } catch (err) {
    console.error('Poll failed:', err);
    exitCode = 1;
  } finally {
    await closePool();
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('Poll crashed:', err);
  process.exit(1);
});
