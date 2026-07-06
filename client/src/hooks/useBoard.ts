import { useEffect, useState } from 'react';

import { apiGet, toUserMessage } from '../lib/api';

import type { BoardResponse, BoardSort } from '../types/board';

/** Arguments to {@link useBoard}. */
interface UseBoardArgs {
  /** Active sector slug, or null for all sectors. */
  sector: string | null;
  sort: BoardSort;
  /** Case-insensitive company-name search query. */
  search: string;
  /** Number of rows to request; grows with "load more" from a fixed offset of 0. */
  limit: number;
}

/** Result of {@link useBoard}. */
interface UseBoardResult {
  board: BoardResponse | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch the leaderboard from `GET /api/board`, refetching whenever the sector, sort,
 * search, or limit changes. The server paginates from offset 0, so `limit` grows with
 * "load more" and always returns the full visible window. Guards against out-of-order
 * responses with a cancelled flag so a fast filter change can't apply a stale result.
 * @param args - Active sector, sort, search, and row limit
 * @returns The board payload (null until resolved) plus loading/error state
 */
export function useBoard({ sector, sort, search, limit }: UseBoardArgs): UseBoardResult {
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchBoard(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ sort, limit: String(limit), offset: '0' });
        if (sector) params.set('sector', sector);
        if (search.trim() !== '') params.set('q', search.trim());

        const data = await apiGet<BoardResponse>(`/api/board?${params.toString()}`);
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
  }, [sector, sort, search, limit]);

  return { board, loading, error };
}
