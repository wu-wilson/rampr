import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useMetaStore } from '../store/metaStore';

import type { Meta } from '../types/meta';

/** Result of {@link useMeta}. */
interface UseMetaResult {
  meta: Meta | null;
  loading: boolean;
  error: string | null;
}

/**
 * Read the shared `/api/meta` payload, loading it on first use and retrying a failed load on each navigation.
 * @returns The meta payload (null until resolved) plus loading/error state
 */
export function useMeta(): UseMetaResult {
  const { pathname } = useLocation();
  const meta = useMetaStore((s) => s.meta);
  const loading = useMetaStore((s) => s.loading);
  const error = useMetaStore((s) => s.error);
  const load = useMetaStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load, pathname]);

  return { meta, loading, error };
}
