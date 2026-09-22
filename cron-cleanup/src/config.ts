import dotenv from 'dotenv';
dotenv.config();

/** Days of `daily_snapshots` history to keep when `RETENTION_DAYS` is unset or malformed. */
const DEFAULT_RETENTION_DAYS = 90;

/** Parse a retention-day count, falling back to the default when missing, `NaN`, or non-positive. */
function parseRetentionDays(raw: string | undefined): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_RETENTION_DAYS;
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
  retentionDays: parseRetentionDays(process.env.RETENTION_DAYS),
} as const;
