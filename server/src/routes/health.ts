/** Health route: GET /api/health — liveness plus the last-poll stamp for the top bar. */
import { Router } from 'express';

import { query } from '../services/db';

const router = Router();

/** Response body for `GET /api/health`. */
interface HealthResponse {
  /** Always `'ok'` when the handler runs (DB outages surface as a 503 via the tail handler). */
  status: 'ok';
  /** `MAX(snapshot_date)` as `YYYY-MM-DD`, or `null` before the first poll. */
  lastUpdated: string | null;
}

router.get('/health', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT to_char(MAX(snapshot_date), 'YYYY-MM-DD') AS last_updated FROM daily_snapshots`,
    );
    const row = result.rows[0] as Record<string, unknown>;

    const response: HealthResponse = {
      status: 'ok',
      lastUpdated: row.last_updated === null ? null : String(row.last_updated),
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

export { router as healthRouter };
