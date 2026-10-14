import { Router } from 'express';

import { readThrough } from '../services/cache';
import { getMeta } from '../services/meta';

const router = Router();

router.get('/meta', async (_req, res, next) => {
  try {
    const cached = await readThrough('meta', getMeta);
    res.set('Cache-Control', cached.cacheControl).type('json').send(cached.body);
  } catch (err) {
    next(err);
  }
});

/** Meta route: GET /api/meta — the release stamp (`updatedAt`, `releaseNumber`, `firstRelease`) and the curated-list facts (`companyCount`, `sources`). */
export { router as metaRouter };
