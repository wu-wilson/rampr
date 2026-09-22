import { useEffect, useState } from 'react';

import { apiGet, toUserMessage } from '../lib/api';

import { BOARD_LIMIT } from '../constants/config';

import type { BoardResponse } from '../types/board';

/** Result of {@link useBoard}. */
interface UseBoardResult {
  board: BoardResponse | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch the whole board from `GET /api/board` once on mount: every company in one page, so
 * sorting and filtering happen locally and rows can slide to their new places. Guards
 * against a stale response with a cancelled flag.
 * @returns The board payload (null until resolved) plus loading/error state
 */
export function useBoard(): UseBoardResult {
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchBoard(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const data = await apiGet<BoardResponse>(`/api/board?limit=${BOARD_LIMIT}`);
        if (!cancelled) setBoard(data);
      } catch (err) {
        if (!cancelled) {
          setError(toUserMessage(err, 'Couldn’t load the board.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBoard();
    return () => {
      cancelled = true;
    };
  }, []);

  return { board, loading, error };
}
