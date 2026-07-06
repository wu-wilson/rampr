import { z } from 'zod';

/** Default page size for the board leaderboard (matches the client's "load more" increment). */
const DEFAULT_LIMIT = 25;
/** Hard cap on page size, so a crafted `limit` can't request an unbounded result set. */
const MAX_LIMIT = 100;

/**
 * Validated, coerced query params for `GET /api/board`.
 * `sector` narrows to one sector slug (omitted = all); `q` is a case-insensitive company-name search;
 * `sort` orders the matched rows (`open` = open count desc, `momentum` = 7d delta desc); `limit`/`offset`
 * paginate. All fields fall back to safe defaults when absent or malformed.
 */
export const BoardQuerySchema = z.object({
  sector: z.string().trim().max(50).optional(),
  q: z.string().trim().max(200).optional(),
  sort: z.enum(['open', 'momentum']).optional().default('open'),
  limit: z.coerce.number().int().positive().max(MAX_LIMIT).optional().default(DEFAULT_LIMIT),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
});

/** Inferred TypeScript type for validated board query params. */
export type BoardQuery = z.infer<typeof BoardQuerySchema>;
