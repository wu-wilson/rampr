import dotenv from 'dotenv';
dotenv.config();

/** Days of `daily_snapshots` history to keep when `RETENTION_DAYS` is unset or malformed. */
const DEFAULT_RETENTION_DAYS = 90;

/** Parse a retention-day count, falling back to the default when missing, `NaN`, or non-positive. */
function parseRetentionDays(raw: string | undefined): number {
  const parsed = parseInt(raw ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_RETENTION_DAYS;
}

/** Typed, frozen configuration loaded from environment variables at startup. */
export const config = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/rampr',
  retentionDays: parseRetentionDays(process.env.RETENTION_DAYS),
} as const;
