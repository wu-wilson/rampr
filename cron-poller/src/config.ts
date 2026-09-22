import dotenv from 'dotenv';
dotenv.config();

/** Default User-Agent identifying the poller to public ATS endpoints. */
const DEFAULT_USER_AGENT = 'rampr (+https://github.com/wu-wilson/rampr)';

/** Parse a positive-integer environment value, falling back when it is unset or malformed. */
function parseIntEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** The local database the packages fall back to, so a fresh clone runs with no env file. */
const LOCAL_DATABASE_URL = 'postgresql://localhost:5432/rampr';

/** Read `DATABASE_URL`, falling back to the local database and saying so, since a silent fallback in production would read as an unreachable server. */
function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;
  console.warn(`DATABASE_URL is unset, falling back to ${LOCAL_DATABASE_URL}`);
  return LOCAL_DATABASE_URL;
}

/** Typed, readonly configuration loaded from environment variables at startup. */
export const config = {
  databaseUrl: databaseUrl(),
  pollConcurrency: parseIntEnv(process.env.POLL_CONCURRENCY, 4),
  requestTimeoutMs: parseIntEnv(process.env.REQUEST_TIMEOUT_MS, 30000),
  userAgent: process.env.USER_AGENT || DEFAULT_USER_AGENT,
} as const;
