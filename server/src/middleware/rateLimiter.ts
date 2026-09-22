import rateLimit from 'express-rate-limit';

import { config } from '../config';

/** Rate limiter for the read-only /api surface — `config.readRateLimitPerHour`/hr/IP (default 600). */
export const readLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: config.readRateLimitPerHour,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again later.' },
});
