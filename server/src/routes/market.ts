import { Router } from 'express';

import { getMarket } from '../services/market';

import type { MarketResponse } from '../services/market';

const router = Router();

router.get('/market', async (_req, res, next) => {
  try {
    const response: MarketResponse = await getMarket();
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/** Market route: GET /api/market — the hiring index, breadth per release, sector totals, and heating/cooling movers. */
export { router as marketRouter };
