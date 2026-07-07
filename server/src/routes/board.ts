/** Board route: GET /api/board — the ranked leaderboard + market headline over `listings` + `daily_snapshots`. */
import { Router } from 'express';

import { BoardQuerySchema } from '../schemas/boardQuery';
import { getBoard } from '../services/board';

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

    const response: BoardResponse = await getBoard(parsed.data);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

export { router as boardRouter };
