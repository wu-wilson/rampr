import { adapters, type NormalizedListing } from './adapters';
import { delay } from './adapters/fetchJson';
import { config } from './config';
import { loadCompanies, reconcileCompany, type CompanyRow } from './db';

/** Small delay before each feed request past the first batch, to stay polite to upstream hosts. */
const POLITE_DELAY_MS = 250;

/** Totals recorded for a completed poll run. */
interface PollTotals {
  /** Companies whose feed was fetched, reconciled, and snapshotted successfully. */
  companiesPolled: number;
  /** Total listings across all successfully polled feeds. */
  listingsSeen: number;
  /** Companies skipped because their feed fetch failed (network / non-2xx / parse error). */
  skipped: number;
  /** Companies whose feed fetched but the reconcile transaction errored (rolled back, no snapshot). */
  errored: number;
}

/** Run tasks with bounded concurrency, staggering every request past the first batch by `POLITE_DELAY_MS`. */
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

/** Fetch one company's feed and reconcile it against `listings`. */
async function pollCompany(company: CompanyRow): Promise<CompanyOutcome> {
  const adapter = adapters[company.provider];

  let listings: NormalizedListing[];
  try {
    listings = await adapter(company.atsId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `Skipping ${company.name} (${company.provider}): feed fetch failed: ${message}`,
    );
    return { polled: false, listingsSeen: 0 };
  }

  await reconcileCompany(company.id, listings);

  return { polled: true, listingsSeen: listings.length };
}

/**
 * Run one full poll across all curated companies with bounded concurrency. A failed feed is
 * counted as `skipped` and a failed reconcile as `errored`, and neither aborts the run.
 * @returns The recorded run totals
 */
export async function runPoll(): Promise<PollTotals> {
  const companies = await loadCompanies();

  const totals: PollTotals = { companiesPolled: 0, listingsSeen: 0, skipped: 0, errored: 0 };

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
      totals.errored += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Poll failed for ${company.name} (${company.provider}): ${message}`);
    }
  });

  await runWithConcurrency(tasks, config.pollConcurrency);

  return totals;
}
