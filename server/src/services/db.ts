import { Pool, QueryResult } from 'pg';

import { config } from '../config';

let pool: Pool | null = null;

/** Postgres SQLSTATE / Node socket codes that mean the server is unreachable, as opposed to a genuine query error. */
const CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', 'EPIPE',
  '08000', '08001', '08003', '08004', '08006', '08007', '08P01',
  '57P01', '57P02', '57P03',
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

/**
 * Classify whether a thrown error is a connection-class failure (server down or restarting) rather than a SQL error.
 * @param err - The value thrown by `pg`
 * @returns True for connection failures, so the caller can map them to a 503 and let real query errors surface as 500s
 */
function isConnectionError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const code = (err as { code?: unknown }).code;
  if (typeof code === 'string' && CONNECTION_ERROR_CODES.has(code)) return true;
  const message = (err as { message?: unknown }).message;
  return typeof message === 'string' && /Connection terminated|server closed the connection|ECONNREFUSED/i.test(message);
}

/**
 * Open the pg pool and probe the connection at boot, logging the outcome.
 * A probe failure is non-fatal — the server still starts and read routes return 503 until Postgres is reachable.
 * `config.databaseUrl` always carries a value (default localhost), so an unset env surfaces as a probe failure against localhost.
 * @returns Resolves after the probe completes, whether it succeeded or failed
 */
export async function initDb(): Promise<void> {
  // Pin the session to UTC so CURRENT_DATE (momentum window, gating, retention) is timezone-independent.
  pool = new Pool({ connectionString: config.databaseUrl, max: 10, options: '-c timezone=UTC' });

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
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Postgres not reachable — read endpoints will return 503 until it recovers: ${message}`);
  }
}

/**
 * Run a parameterized query against the pool.
 * Connection-class failures (Postgres down or restarting, at boot or mid-flight) are mapped to a 503 `DatabaseUnavailableError` so reads degrade gracefully; genuine SQL errors propagate to the tail handler as 500s.
 * @param text - SQL with `$1`, `$2`, ... placeholders; never interpolate input
 * @param params - Values bound to the placeholders, in order
 * @returns The raw `pg` `QueryResult`
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
