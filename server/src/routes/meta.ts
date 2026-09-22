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

/** Meta route: GET /api/meta — the release stamp (`updatedAt`, `releaseNumber`, `firstRelease`) and the curated-list facts (`companyCount`, `sources`). */
export { router as metaRouter };
