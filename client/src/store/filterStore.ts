import { create } from 'zustand';

import type { BoardSort } from '../types/board';

/** Shared Board filter state: sector, sort, and search, plus their setters. */
interface FilterStore {
  /** Active sector slug, or null for all sectors. */
  sector: string | null;
  sort: BoardSort;
  /** Case-insensitive company-name search query. */
  search: string;

  setSector: (sector: string | null) => void;
  setSort: (sort: BoardSort) => void;
  setSearch: (search: string) => void;
}

/**
 * Zustand store for the Board's filter controls. Kept minimal — the screen resets
 * pagination whenever any of these change, so no page state lives here.
 * @returns The shared sector / sort / search state and their setters.
 */
export const useFilterStore = create<FilterStore>((set) => ({
  sector: null,
  sort: 'open',
  search: '',

  setSector: (sector) => {
    set({ sector });
  },
  setSort: (sort) => {
    set({ sort });
  },
  setSearch: (search) => {
    set({ search });
  },
}));
