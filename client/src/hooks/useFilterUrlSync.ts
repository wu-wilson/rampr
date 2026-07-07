import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useFilterStore } from '../store/filterStore';

import { parseBoardSort } from '../types/board';

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
    const urlSort = parseBoardSort(searchParams.get('sort'));
    const urlSearch = searchParams.get('q') ?? '';
    if (urlSector !== store.sector) store.setSector(urlSector);
    if (urlSort !== store.sort) store.setSort(urlSort);
    if (urlSearch !== store.search) store.setSearch(urlSearch);
  }, [searchParams]);

  // store → URL: mirror filter changes into the query string, replacing (not pushing) and only
  // when the string actually differs. The values are read live via getState() — not the render-scope
  // closures, which would be stale relative to the URL→store seed above and make the two effects
  // fight (oscillating store↔URL every render). The store selectors below stay in the deps purely to
  // re-run this effect when a filter changes.
  useEffect(() => {
    const { sector: s, sort: so, search: q } = useFilterStore.getState();
    // Seed from the current params so unrelated keys (e.g. tracking tags) survive; manage only ours.
    const next = new URLSearchParams(searchParams);
    if (s) next.set('sector', s);
    else next.delete('sector');
    if (so !== 'open') next.set('sort', so);
    else next.delete('sort');
    if (q) next.set('q', q);
    else next.delete('q');
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [sector, sort, search, searchParams, setSearchParams]);
}
