import dotenv from 'dotenv';
dotenv.config();

/** Parse a whole-number environment value of at least `min`, falling back when it is unset, blank, or malformed. */
function parseIntEnv(value: string | undefined, fallback: number, min = 1): number {
  const parsed = value?.trim() ? Number(value) : NaN;
  return Number.isInteger(parsed) && parsed >= min ? parsed : fallback;
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
  port: parseIntEnv(process.env.PORT, 3001),
  databaseUrl: databaseUrl(),
  readRateLimitPerHour: parseIntEnv(process.env.READ_RATE_LIMIT_PER_HOUR, 600),
  allowedOrigins: process.env.ALLOWED_ORIGINS || '*',
  cacheTtlSeconds: parseIntEnv(process.env.CACHE_TTL_SECONDS, 300, 0),
} as const;
