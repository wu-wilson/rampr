import { Pool } from 'pg';

import { config } from './config';

import type { AtsProvider, NormalizedListing } from './adapters';

/** Shared pool sized to the poll concurrency, so each worker's reconcile transaction holds its own client. */
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: config.pollConcurrency,
  connectionTimeoutMillis: 5000,
  // UTC so the snapshot's CURRENT_DATE is the release day; a statement timeout so a hung Postgres can't stall the run.
  options: '-c timezone=UTC -c statement_timeout=30000',
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

/** A curated company row to poll. */
export interface CompanyRow {
  id: number;
  name: string;
  provider: AtsProvider;
  /** Provider board token (greenhouse token / lever site / ashby org). */
  atsId: string;
}

/** Narrow the `ats_provider` column to an `AtsProvider`; its check constraint allows nothing else, so any other value throws. */
function toAtsProvider(value: unknown): AtsProvider {
  if (value === 'greenhouse' || value === 'lever' || value === 'ashby') return value;
  throw new Error(`Unknown ATS provider: ${String(value)}`);
}

/**
 * Load every curated company, ordered by id for deterministic runs.
 * @returns The companies to poll
 */
export async function loadCompanies(): Promise<CompanyRow[]> {
  const result = await pool.query<Record<string, unknown>>(
    `SELECT id, name, ats_provider, ats_id
       FROM companies
      ORDER BY id`,
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    provider: toAtsProvider(row.ats_provider),
    atsId: String(row.ats_id),
  }));
}

/**
 * Reconcile a company's open listings and write today's snapshot in one transaction.
 * @param companyId - The company being reconciled
 * @param listings - The company's open roles from its feed; an empty list is a genuine zero
 * @returns Resolves once committed; any error rolls back to the previous poll's state
 */
export async function reconcileCompany(
  companyId: number,
  listings: NormalizedListing[],
): Promise<void> {
  const client = await pool.connect();
  // A checked-out client has no pool listener, so a dropped connection would otherwise crash the whole run; the next
  // query fails instead, the company is counted as errored, and the broken client is discarded.
  let broken = false;
  const handleError = (): void => {
    broken = true;
  };
  client.on('error', handleError);
  try {
    await client.query('BEGIN');

    for (const listing of listings) {
      await client.query(
        `INSERT INTO listings
           (company_id, external_id, department, location, remote_type)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (company_id, external_id) DO UPDATE SET
           department  = EXCLUDED.department,
           location    = EXCLUDED.location,
           remote_type = EXCLUDED.remote_type`,
        [companyId, listing.externalId, listing.department, listing.location, listing.remoteType],
      );
    }

    const presentExternalIds = listings.map((listing) => listing.externalId);
    await client.query(
      `DELETE FROM listings
        WHERE company_id = $1
          AND external_id <> ALL($2::text[])`,
      [companyId, presentExternalIds],
    );

    // Count the reconciled rows, not the feed, so duplicate feed IDs can't inflate it; a same-day re-run overwrites the row.
    await client.query(
      `INSERT INTO daily_snapshots (company_id, snapshot_date, open_count)
       SELECT $1, CURRENT_DATE, COUNT(*) FROM listings WHERE company_id = $1
       ON CONFLICT (company_id, snapshot_date) DO UPDATE SET
         open_count = EXCLUDED.open_count`,
      [companyId],
    );

    await client.query('COMMIT');
  } catch (err) {
    // Roll back best-effort; never let a failed ROLLBACK (e.g. a dead connection) mask the real cause.
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore — the original error below is the meaningful one */
    }
    throw err;
  } finally {
    client.off('error', handleError);
    client.release(broken);
  }
}

/**
 * Close the connection pool at process shutdown.
 * @returns Resolves once the pool has drained
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
