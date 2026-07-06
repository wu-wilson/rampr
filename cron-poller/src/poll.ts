import { adapters, type NormalizedListing } from './adapters';
import { config } from './config';
import { loadCompanies, reconcileCompany, type CompanyRow } from './db';

/** Small delay before each feed request past the first batch, to stay polite to upstream hosts. */
const POLITE_DELAY_MS = 250;

/** Totals recorded for a completed poll run. */
export interface PollTotals {
  /** Companies whose feed was fetched, reconciled, and snapshotted successfully. */
  companiesPolled: number;
  /** Total listings across all successfully polled feeds. */
  listingsSeen: number;
  /** Companies skipped because their feed fetch failed (network / non-2xx / parse error). */
  skipped: number;
}

/** Pause for the given number of milliseconds. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run `tasks` with bounded concurrency via a tiny inline limiter (no `p-limit`): up to
 * `limit` workers drain a shared cursor, staggering every request past the first batch
 * by `POLITE_DELAY_MS` to stay polite to upstream hosts.
 * @param tasks - The unit-of-work functions to run
 * @param limit - Maximum number running at once
 * @returns Resolves once every task settles
 */
async function runWithConcurrency(
  tasks: Array<() => Promise<void>>,
  limit: number,
): Promise<void> {
  let cursor = 0;
  const workerCount = Math.max(1, Math.min(limit, tasks.length));
  const worker = async (): Promise<void> => {
    while (cursor < tasks.length) {
      const index = cursor;
      cursor += 1;
      // Stagger every request past the initial batch to avoid bursting a host.
      if (index >= workerCount) {
        await delay(POLITE_DELAY_MS);
      }
      await tasks[index]();
    }
  };
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

/** Outcome of polling a single company. */
interface CompanyOutcome {
  /** Whether the feed was fetched, reconciled, and snapshotted (false only on fetch failure). */
  polled: boolean;
  /** Listings reconciled for the company; 0 when skipped. */
  listingsSeen: number;
}

/**
 * Fetch one company's feed and reconcile it against `listings`. A fetch that throws
 * (network error, non-2xx, or unparseable body) is isolated and skipped, so an ATS outage
 * can never delete a company's listings or write a bogus count. A successful fetch —
 * including one that returns zero roles — is a real observation: upsert every listing,
 * hard-delete the departed ones, and write today's snapshot at the reconciled count
 * (`0` when the feed is empty).
 * @param company - The company to poll
 * @returns The company's outcome — polled with its listing count, or a skip on fetch failure
 */
async function pollCompany(company: CompanyRow): Promise<CompanyOutcome> {
  const adapter = adapters[company.provider];

  let listings: NormalizedListing[];
  try {
    listings = await adapter(company.atsId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `Skipping ${company.name} (${company.provider}): feed fetch failed — ${message}`,
    );
    return { polled: false, listingsSeen: 0 };
  }

  await reconcileCompany(company.id, listings);

  return { polled: true, listingsSeen: listings.length };
}

/**
 * Run one full poll across all curated companies.
 *
 * Companies run with bounded concurrency and a small per-host delay. Each company is
 * isolated in its own try/catch — a feed 404/timeout/parse failure is counted as skipped
 * and never reconciles or snapshots, and never aborts the run. A
 * failure to load companies still throws (fatal).
 * @returns The recorded run totals
 */
export async function runPoll(): Promise<PollTotals> {
  const companies = await loadCompanies();

  const totals: PollTotals = { companiesPolled: 0, listingsSeen: 0, skipped: 0 };

  const tasks = companies.map((company) => async (): Promise<void> => {
    try {
      const outcome = await pollCompany(company);
      if (outcome.polled) {
        totals.companiesPolled += 1;
        totals.listingsSeen += outcome.listingsSeen;
      } else {
        totals.skipped += 1;
      }
    } catch (err) {
      // A DB failure while reconciling one company is isolated and counted, not fatal.
      totals.skipped += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Poll failed for ${company.name} (${company.provider}): ${message}`);
    }
  });

  await runWithConcurrency(tasks, config.pollConcurrency);

  return totals;
}
