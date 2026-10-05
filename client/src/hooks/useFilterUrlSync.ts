import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useFilterStore } from '../store/filterStore';

import { parseBoardSort, serializeBoardSort } from '../lib/sort';

/** Two-way sync between the company table store and the URL's `sector`, `sort`, and `q` params. */
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
    if (urlSort.key !== store.sort.key || urlSort.ascending !== store.sort.ascending) store.setSort(urlSort);
    if (urlSearch !== store.search) store.setSearch(urlSearch);
  }, [searchParams]);

  // store → URL: mirror changes into the query string, replacing (not pushing) and only when the
  // string actually differs. Values are read live via getState(), not the render-scope closures,
  // which would be stale relative to the seed above and make the two effects fight. The store
  // selectors stay in the deps purely to re-run this effect when a filter changes.
  useEffect(() => {
    const { sector: s, sort: so, search: q } = useFilterStore.getState();
    const next = new URLSearchParams(searchParams);
    if (s) next.set('sector', s);
    else next.delete('sector');
    const sortValue = serializeBoardSort(so);
    if (sortValue) next.set('sort', sortValue);
    else next.delete('sort');
    if (q) next.set('q', q);
    else next.delete('q');
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [sector, sort, search, searchParams, setSearchParams]);
}
