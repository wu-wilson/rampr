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

/**
 * Load every curated company, ordered by id for deterministic runs.
 * @returns The companies to poll
 */
export async function loadCompanies(): Promise<CompanyRow[]> {
  const result = await pool.query(
    `SELECT id, name, ats_provider, ats_id
       FROM companies
      ORDER BY id`,
  );
  return result.rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: Number(row.id),
      name: String(row.name),
      // `ats_provider` is DB-constrained to the provider enum, so the union narrowing is safe.
      provider: String(row.ats_provider) as AtsProvider,
      atsId: String(row.ats_id),
    };
  });
}

/**
 * Reconcile one company's open listings and write today's snapshot in a single transaction, so
 * an error mid-way rolls back to the previous poll's state. An empty feed is a genuine zero, the
 * snapshot counts the reconciled table so duplicate feed IDs can't inflate it, and a same-day
 * re-run overwrites the row.
 * @param companyId - The company being reconciled
 * @param listings - The company's current open roles, normalized from its feed
 * @returns Resolves once the transaction commits
 */
export async function reconcileCompany(
  companyId: number,
  listings: NormalizedListing[],
): Promise<void> {
  const client = await pool.connect();
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
    client.release();
  }
}

/**
 * Close the connection pool. Call once at process shutdown.
 * @returns Resolves once the pool has drained
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
