import { closePool } from './db';
import { runPoll } from './poll';

/** Poll every curated company and log the run totals; exits 1 when the company list cannot be loaded or no board could be read. */
async function main(): Promise<void> {
  let exitCode = 0;

  try {
    const totals = await runPoll();
    console.log(
      `Poll complete: ${totals.companiesPolled} polled, ` +
        `${totals.listingsSeen} listings seen, ${totals.skipped} skipped, ${totals.errored} errored`,
    );
    // A morning where no board was read is a failed release, not a quiet success.
    if (totals.companiesPolled === 0) exitCode = 1;
  } catch (err) {
    console.error('Poll failed:', err);
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
  console.error('Poll crashed:', err);
  process.exit(1);
});
