import { create } from 'zustand';

import { apiGet, toUserMessage } from '../lib/api';

import type { Meta } from '../types/meta';

/** The release stamp and Method-page facts, shared by the masthead and the Method page. */
interface MetaStore {
  meta: Meta | null;
  loading: boolean;
  error: string | null;
  /** Fetch `GET /api/meta` unless it is already loaded or in flight, so every caller shares one request. */
  load: () => Promise<void>;
}

/** The request in flight, so concurrent callers share it. */
let request: Promise<void> | null = null;

/**
 * Zustand store for `GET /api/meta`. One fetch serves every caller, and a failed fetch can be
 * retried by calling `load` again.
 * @returns The meta payload (null until resolved), loading and error state, and the loader
 */
export const useMetaStore = create<MetaStore>((set, get) => ({
  meta: null,
  loading: true,
  error: null,

  load: () => {
    if (get().meta) return Promise.resolve();
    request ??= (async () => {
      set({ loading: true, error: null });
      try {
        const meta = await apiGet<Meta>('/api/meta');
        set({ meta, loading: false });
      } catch (err) {
        set({ error: toUserMessage(err, 'Couldn’t load Rampr.'), loading: false });
      } finally {
        request = null;
      }
    })();
    return request;
  },
}));
