import { z } from 'zod';

/** Validated route params for `GET /api/companies/:slug`: a lowercase, hyphenated slug, rejected before the DB and treated as an unknown company when it doesn't match. */
export const CompanyParamsSchema = z.object({
  slug: z.string().max(100).regex(/^[a-z0-9-]+$/),
});
