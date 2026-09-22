import { z } from 'zod';

/** Rows returned when `limit` is absent. */
const DEFAULT_LIMIT = 25;
/** Hard cap on `limit`; the client requests the whole board in one page, so this must stay above the seeded company count. */
const MAX_LIMIT = 250;

/** Validated, coerced query params for `GET /api/board`: `limit` alone, the most companies to return by rank. */
export const BoardQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(MAX_LIMIT).default(DEFAULT_LIMIT),
});
