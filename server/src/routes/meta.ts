/** Meta route: GET /api/meta — site-wide totals, last-updated stamp, gating, and ATS sources. */
import { Router } from 'express';

import { getMeta } from '../services/meta';

import type { MetaResponse } from '../services/meta';

const router = Router();

router.get('/meta', async (_req, res, next) => {
  try {
    const response: MetaResponse = await getMeta();
    res.json(response);
  } catch (err) {
    next(err);
  }
});

export { router as metaRouter };
