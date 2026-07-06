import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useFilterStore } from '../store/filterStore';

import type { BoardSort } from '../types/board';

/**
 * Two-way sync between the Board filter store and the URL query string, so a filtered or sorted
 * Board is linkable and restorable. On mount and on browser back/forward the params seed the
 * store; any filter change is written back with `replace` (never stacking history). It manages
 * only the `sector`, `sort` (omitted when `open`), and `q` keys — non-default values keep shared
 * links clean, and any unrelated params are left untouched. Call once from the Board screen.
 * @returns Nothing
 */
export function useFilterUrlSync(): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const sector = useFilterStore((s) => s.sector);
  const sort = useFilterStore((s) => s.sort);
  const search = useFilterStore((s) => s.search);

  // URL → store: apply the params on mount and on browser navigation. Reads the store
  // non-reactively (getState) so this effect depends only on the URL, never looping with the writer.
  useEffect(() => {
    const store = useFilterStore.getState();
    const urlSector = searchParams.get('sector');
    const urlSort: BoardSort = searchParams.get('sort') === 'momentum' ? 'momentum' : 'open';
    const urlSearch = searchParams.get('q') ?? '';
    if (urlSector !== store.sector) store.setSector(urlSector);
    if (urlSort !== store.sort) store.setSort(urlSort);
    if (urlSearch !== store.search) store.setSearch(urlSearch);
  }, [searchParams]);

  // store → URL: mirror filter changes into the query string, replacing (not pushing) and only
  // when the string actually differs, so the two effects converge instead of ping-ponging.
  useEffect(() => {
    // Seed from the current params so unrelated keys (e.g. tracking tags) survive; manage only ours.
    const next = new URLSearchParams(searchParams);
    if (sector) next.set('sector', sector);
    else next.delete('sector');
    if (sort !== 'open') next.set('sort', sort);
    else next.delete('sort');
    if (search) next.set('q', search);
    else next.delete('q');
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [sector, sort, search, searchParams, setSearchParams]);
}
