import { useEffect, useState } from 'react';

import { apiGet, toUserMessage } from '../lib/api';

import type { Meta } from '../types/meta';

/** Result of {@link useMeta}. */
interface UseMetaResult {
  meta: Meta | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch market-wide metadata from `GET /api/meta` once on mount. `updatedAt` is null
 * before the first poll, which drives the app's day-zero "tracking just started" state.
 * Guards against a stale response with a cancelled flag.
 * @returns The meta payload (null until resolved) plus loading/error state
 */
export function useMeta(): UseMetaResult {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMeta(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const data = await apiGet<Meta>('/api/meta');
        if (!cancelled) setMeta(data);
      } catch (err) {
        if (!cancelled) {
          setError(toUserMessage(err, 'Couldn’t load rampr.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  return { meta, loading, error };
}
