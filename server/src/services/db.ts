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
  const code = (err as { code?: unknown }).code;
  if (typeof code === 'string' && CONNECTION_ERROR_CODES.has(code)) return true;
  const message = (err as { message?: unknown }).message;
  return typeof message === 'string' && /Connection terminated|server closed the connection|ECONNREFUSED|timeout expired|timeout exceeded when trying to connect/i.test(message);
}

/**
 * Open the pg pool and probe the connection at boot, logging the outcome. A probe failure is not
 * fatal: the server still starts, and read routes return 503 until Postgres is reachable.
 * @returns Resolves after the probe completes, whether it succeeded or failed
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
 * Run a parameterized query against the pool.
 * Connection-class failures (Postgres down or restarting, at boot or mid-flight) are mapped to a 503 `DatabaseUnavailableError` so reads degrade gracefully; genuine SQL errors propagate to the tail handler as 500s.
 * @param text - SQL with `$1`, `$2`, ... placeholders; never interpolate input
 * @param params - Values bound to the placeholders, in order
 * @returns The result set; `rows` is untyped and must be coerced at the call site
 */
export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  if (!pool) {
    throw new DatabaseUnavailableError();
  }
  try {
    return await pool.query(text, params);
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
