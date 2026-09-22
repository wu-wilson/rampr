import { create } from 'zustand';

import { DEFAULT_BOARD_SORT, naturalAscending, type BoardSort, type BoardSortKey } from '../types/board';

/** The company table's shared state: sector, sort, and search, plus their setters. */
interface FilterStore {
  /** Active sector slug, or null for all sectors. */
  sector: string | null;
  sort: BoardSort;
  /** Case-insensitive company-name search query. */
  search: string;

  setSector: (sector: string | null) => void;
  setSort: (sort: BoardSort) => void;
  /** Sort by a column header: a first click takes the column's natural order, a second flips it. */
  toggleSort: (key: BoardSortKey) => void;
  setSearch: (search: string) => void;
}

/**
 * Zustand store for the company table's controls. The whole board is held client-side, so these only
 * reorder and narrow rows that are already loaded.
 * @returns The shared sector / sort / search state and their setters.
 */
export const useFilterStore = create<FilterStore>((set) => ({
  sector: null,
  sort: DEFAULT_BOARD_SORT,
  search: '',

  setSector: (sector) => {
    set({ sector });
  },
  setSort: (sort) => {
    set({ sort });
  },
  toggleSort: (key) => {
    set((state) => ({
      sort:
        state.sort.key === key
          ? { key, ascending: !state.sort.ascending }
          : { key, ascending: naturalAscending(key) },
    }));
  },
  setSearch: (search) => {
    set({ search });
  },
}));
