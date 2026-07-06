import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

import { config } from './config';
import { createCorsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { readLimiter } from './middleware/rateLimiter';
import { boardRouter } from './routes/board';
import { companyRouter } from './routes/company';
import { healthRouter } from './routes/health';
import { marketRouter } from './routes/market';
import { metaRouter } from './routes/meta';
import { initDb } from './services/db';

const app = express();

// Resolves req.ip to the client behind Railway's proxy.
app.set('trust proxy', 1);

// Middleware
app.use(createCorsMiddleware());
app.use(express.json({ limit: '100kb' }));

// Health check (Railway healthcheckPath).
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'rampr-api' });
});

// Routes (read-only — per-IP rate limited).
app.use('/api', readLimiter);
app.use('/api', boardRouter);
app.use('/api', companyRouter);
app.use('/api', marketRouter);
app.use('/api', metaRouter);
app.use('/api', healthRouter);

// Error handler (tail)
app.use(errorHandler);

// Start (after the DB connection probe)
initDb()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`rampr API running on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start rampr API:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
