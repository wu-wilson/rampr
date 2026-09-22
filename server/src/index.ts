import express from 'express';

import { config } from './config';
import { createCorsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { readLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { boardRouter } from './routes/board';
import { companyRouter } from './routes/company';
import { marketRouter } from './routes/market';
import { metaRouter } from './routes/meta';
import { initDb } from './services/db';

const app = express();

// Resolves req.ip to the client behind Railway's proxy.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Middleware
app.use(requestLogger);
app.use(createCorsMiddleware());

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

// Unknown paths answer in JSON like everything else.
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler (tail)
app.use(errorHandler);

/** Log why the API could not start and exit non-zero. */
function fail(err: unknown): void {
  console.error('Failed to start rampr API:', err instanceof Error ? err.message : err);
  process.exit(1);
}

// Start (after the DB connection probe)
initDb()
  .then(() => {
    const server = app.listen(config.port, () => {
      console.log(`rampr API running on port ${config.port}`);
    });
    // A port that can't be bound raises here rather than rejecting, so it needs its own handler.
    server.on('error', (err: Error) => {
      fail(err);
    });
  })
  .catch(fail);
