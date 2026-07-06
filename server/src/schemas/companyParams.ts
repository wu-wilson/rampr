import { z } from 'zod';

/**
 * Validated route params for `GET /api/companies/:slug`.
 * `slug` is a lowercase, hyphenated company identifier (letters, digits, hyphens); a value that
 * can't match that shape is rejected before hitting the DB and treated as an unknown company.
 */
export const CompanyParamsSchema = z.object({
  slug: z.string().trim().max(100).regex(/^[a-z0-9-]+$/),
});

/** Inferred TypeScript type for validated company route params. */
export type CompanyParams = z.infer<typeof CompanyParamsSchema>;
