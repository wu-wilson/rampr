import { Router } from 'express';

import { readThrough } from '../services/cache';
import { withSnapshot } from '../services/db';
import { getMarket } from '../services/market';

const router = Router();

router.get('/market', async (_req, res, next) => {
  try {
    const cached = await readThrough('market', () => withSnapshot(() => getMarket()));
    res.set('Cache-Control', cached.cacheControl).type('json').send(cached.body);
  } catch (err) {
    next(err);
  }
});

/** Market route: GET /api/market — the hiring index, breadth per release, sector totals, and heating/cooling movers. */
export { router as marketRouter };
