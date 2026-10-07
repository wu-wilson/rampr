import { Router } from 'express';

import { BoardQuerySchema } from '../schemas/boardQuery';
import { getBoard } from '../services/board';
import { withSnapshot } from '../services/db';

import type { BoardResponse } from '../services/board';

const router = Router();

router.get('/board', async (req, res, next) => {
  try {
    const parsed = BoardQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      console.warn(`Invalid board query: ${JSON.stringify(parsed.error.issues)}`);
      res.status(400).json({ error: 'Invalid query parameters' });
      return;
    }

    const response: BoardResponse = await withSnapshot(() => getBoard(parsed.data.limit));
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/** Board route: GET /api/board — the market lead and the ranked company table over `listings` + `daily_snapshots`. */
export { router as boardRouter };
