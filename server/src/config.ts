import dotenv from 'dotenv';
dotenv.config();

/** Typed, readonly configuration loaded from environment variables at startup. */
export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/rampr',
  readRateLimitPerHour: parseInt(process.env.READ_RATE_LIMIT_PER_HOUR || '600', 10),
  allowedOrigins: process.env.ALLOWED_ORIGINS || '*',
} as const;
