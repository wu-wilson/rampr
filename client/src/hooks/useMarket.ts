import { useEffect, useState } from 'react';

import { apiGet, toUserMessage } from '../lib/api';

import type { MarketResponse } from '../types/market';

/** Result of {@link useMarket}. */
interface UseMarketResult {
  market: MarketResponse | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch the market rollup from `GET /api/market` once on mount: sector totals (always
 * live) plus the hiring index and movers (gated until 14 daily snapshots exist). Guards
 * against a stale response with a cancelled flag.
 * @returns The market payload (null until resolved) plus loading/error state
 */
export function useMarket(): UseMarketResult {
  const [market, setMarket] = useState<MarketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMarket(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const data = await apiGet<MarketResponse>('/api/market');
        if (!cancelled) setMarket(data);
      } catch (err) {
        if (!cancelled) {
          setError(toUserMessage(err, 'Couldn’t load the market.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMarket();
    return () => {
      cancelled = true;
    };
  }, []);

  return { market, loading, error };
}
