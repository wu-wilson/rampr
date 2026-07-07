import dotenv from 'dotenv';
dotenv.config();

/** Default User-Agent identifying the poller to public ATS endpoints. */
const DEFAULT_USER_AGENT = 'rampr (+https://github.com/wu-wilson/rampr)';

/**
 * Parse a positive-integer environment value, falling back when it is unset or malformed.
 * Guards against a `NaN` from a non-numeric var silently poisoning pool sizing, the
 * concurrency limiter, and the fetch timeout.
 * @param value - The raw environment variable value, or undefined when unset
 * @param fallback - The value used when `value` is missing or not a positive integer
 * @returns The parsed positive integer, or `fallback`
 */
function parseIntEnv(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Typed, readonly configuration loaded from environment variables at startup. */
export const config = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/rampr',
  pollConcurrency: parseIntEnv(process.env.POLL_CONCURRENCY, 4),
  requestTimeoutMs: parseIntEnv(process.env.REQUEST_TIMEOUT_MS, 10000),
  userAgent: process.env.USER_AGENT || DEFAULT_USER_AGENT,
} as const;
