/** Company route: GET /api/companies/:slug — per-company detail (open, breakdowns, momentum, trajectory). */
import { Router } from 'express';

import { CompanyParamsSchema } from '../schemas/companyParams';
import { getCompany } from '../services/company';

import type { CompanyResponse } from '../services/company';

const router = Router();

router.get('/companies/:slug', async (req, res, next) => {
  try {
    const parsed = CompanyParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    const response: CompanyResponse | null = await getCompany(parsed.data.slug);
    if (response === null) {
      console.warn(`Company not found: ${parsed.data.slug}`);
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
});

export { router as companyRouter };
