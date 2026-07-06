/** Market route: GET /api/market — sector totals, the hiring index, and heating/cooling movers. */
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

export { router as marketRouter };
