import rateLimit from 'express-rate-limit';

import { config } from '../config';

/** Rate limiter for the read-only /api surface — `config.readRateLimitPerHour`/hr/IP (default 600). */
export const readLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: config.readRateLimitPerHour,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — try again later' },
});
