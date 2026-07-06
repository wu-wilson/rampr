import { Pool, QueryResult } from 'pg';

import { config } from './config';
import type { AtsProvider, NormalizedListing } from './adapters';

/**
 * Shared connection pool. Sized to the poll concurrency so each worker's reconcile
 * transaction can hold its own dedicated client without serializing on a single connection.
 */
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: Math.max(1, config.pollConcurrency),
  // Pin the session to UTC so the snapshot's CURRENT_DATE matches the DB's day boundary everywhere.
  options: '-c timezone=UTC',
});

/** A curated company row to poll. */
export interface CompanyRow {
  /** Company surrogate id. */
  id: number;
  /** Display name. */
  name: string;
  /** ATS provider. */
  provider: AtsProvider;
  /** Provider board token (greenhouse token / lever site / ashby org). */
  atsId: string;
}

/**
 * Run a parameterized query against the pool.
 * @param text - SQL with `$1`, `$2`, ... placeholders; never interpolate input
 * @param params - Values bound to the placeholders, in order
 * @returns The unwrapped driver result; read `.rows` for the selected records
 */
async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  return pool.query(text, params);
}

/**
 * Load every curated company, ordered by id for deterministic runs.
 * @returns The companies to poll
 */
export async function loadCompanies(): Promise<CompanyRow[]> {
  const result = await query(
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
 * Reconcile one company's open listings and write today's snapshot, atomically.
 *
 * Runs the whole reconcile in a single transaction on a dedicated pooled client: upsert
 * every role in `listings` (refreshing the mutable breakdown fields on conflict), hard-delete
 * the rows no longer present, then snapshot the reconciled `COUNT(*)`. Either the company's
 * state advances fully or not at all — a crash or error mid-reconcile rolls back, leaving the
 * previous poll's state intact rather than a partial listing set or a missing snapshot. An
 * empty `listings` is valid: it deletes all of the company's rows and snapshots zero. The
 * snapshot counts the reconciled table (not the feed array), so duplicate feed IDs collapsed
 * by the unique key can't inflate it. `CURRENT_DATE` is UTC, so a same-day re-run overwrites
 * rather than duplicates the snapshot row.
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
