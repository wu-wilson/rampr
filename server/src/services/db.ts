import { Pool } from 'pg';

import { config } from '../config';

import type { QueryResult } from 'pg';

let pool: Pool | null = null;

/** Postgres SQLSTATE / Node socket codes that mean the server is unreachable or unresponsive, as opposed to a genuine query error. */
const CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', 'EPIPE',
  '08000', '08001', '08003', '08004', '08006', '08007', '08P01',
  '57014', '57P01', '57P02', '57P03',
]);

/** Error thrown by `query` when Postgres is unreachable; carries a 503 + `isPublic` so the tail handler degrades gracefully instead of leaking a 500. */
class DatabaseUnavailableError extends Error {
  readonly status = 503;
  readonly isPublic = true;

  constructor() {
    super('Service temporarily unavailable');
    this.name = 'DatabaseUnavailableError';
  }
}

/** Classify whether a thrown error is a connection-class failure (server down or restarting) rather than a SQL error. */
function isConnectionError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  if ('code' in err && typeof err.code === 'string' && CONNECTION_ERROR_CODES.has(err.code)) return true;
  return (
    'message' in err &&
    typeof err.message === 'string' &&
    /Connection terminated|server closed the connection|ECONNREFUSED|timeout expired|timeout exceeded when trying to connect/i.test(err.message)
  );
}

/**
 * Open the pg pool and probe the connection, starting the server even when Postgres is down.
 * @returns Resolves after the probe, whether it succeeded or failed; reads return 503 until Postgres is reachable
 */
export async function initDb(): Promise<void> {
  // UTC so snapshot dates read as the poller wrote them; timeouts so a hung Postgres degrades to a 503 instead of an open request.
  pool = new Pool({
    connectionString: config.databaseUrl,
    max: 10,
    connectionTimeoutMillis: 5000,
    options: '-c timezone=UTC -c statement_timeout=10000',
  });

  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err.message);
  });

  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
    console.log('Connected to Postgres');
  } catch (err) {
    // A refused connection to a host with several addresses (localhost) is an AggregateError with an empty message, so fall back to its code.
    const reason = err instanceof Error ? err.message || ('code' in err ? String(err.code) : err.name) : String(err);
    console.warn(`Postgres not reachable, so read endpoints return 503 until it recovers: ${reason}`);
  }
}

/**
 * Run a parameterized query, mapping connection failures to a 503 so reads degrade gracefully.
 * @param text - SQL with `$1`, `$2`, ... placeholders; never interpolate input
 * @param params - Values bound to the placeholders, in order
 * @returns The result set, each row a column map whose values the caller coerces; a SQL error rejects as a 500
 */
export async function query(text: string, params?: unknown[]): Promise<QueryResult<Record<string, unknown>>> {
  if (!pool) {
    throw new DatabaseUnavailableError();
  }
  try {
    return await pool.query<Record<string, unknown>>(text, params);
  } catch (err) {
    if (isConnectionError(err)) {
      throw new DatabaseUnavailableError();
    }
    throw err;
  }
}

/**
 * Coerce a nullable numeric pg column to a number.
 * @param value - The raw column value, a number, numeric string, `null`, or absent
 * @returns The number, or `null` when the column was `null` or absent
 */
export function toNullableInt(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}
