import { Router } from 'express';

import { CompanyParamsSchema } from '../schemas/companyParams';
import { readThrough } from '../services/cache';
import { getCompany } from '../services/company';
import { withSnapshot } from '../services/db';

const router = Router();

router.get('/companies/:slug', async (req, res, next) => {
  try {
    const parsed = CompanyParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    const { slug } = parsed.data;
    const cached = await readThrough(`company:${slug}`, () => withSnapshot(() => getCompany(slug)));
    if (cached === null) {
      console.warn(`Company not found: ${slug}`);
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    res.set('Cache-Control', cached.cacheControl).type('json').send(cached.body);
  } catch (err) {
    next(err);
  }
});

/** Company route: GET /api/companies/:slug — per-company detail (open, breakdowns, 7-day change, trajectory). */
export { router as companyRouter };
