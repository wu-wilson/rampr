/** A sortable column of the company table. */
export type BoardSortKey = 'name' | 'open' | 'd7' | 'd30';

/** The active sort of the company table: a column and whether it runs ascending. */
export interface BoardSort {
  key: BoardSortKey;
  ascending: boolean;
}

/** The sort the company table opens with: most postings first. */
export const DEFAULT_BOARD_SORT: BoardSort = { key: 'open', ascending: false };

/**
 * The direction a column sorts in on its first click: names read A to Z, numbers largest first.
 * @param key - The column
 * @returns True when the column's natural order is ascending
 */
export function naturalAscending(key: BoardSortKey): boolean {
  return key === 'name';
}

/**
 * Narrow a URL `sort` value to a {@link BoardSort}. The value is the column key, with `-asc` or
 * `-desc` appended only when the direction departs from the column's natural order; anything
 * unrecognized falls back to the default sort.
 * @param value - The raw string to narrow (or null, e.g. a missing URL param)
 * @returns The matching sort, or the default
 */
export function parseBoardSort(value: string | null): BoardSort {
  if (value === null) return DEFAULT_BOARD_SORT;
  const [key, direction] = value.split('-');
  if (key !== 'name' && key !== 'open' && key !== 'd7' && key !== 'd30') return DEFAULT_BOARD_SORT;
  const ascending = direction === 'asc' ? true : direction === 'desc' ? false : naturalAscending(key);
  return { key, ascending };
}

/**
 * Serialize a {@link BoardSort} for the URL, omitting the default entirely and the direction
 * suffix whenever it matches the column's natural order.
 * @param sort - The active sort
 * @returns The `sort` param value, or null when the sort is the default
 */
export function serializeBoardSort(sort: BoardSort): string | null {
  if (sort.key === DEFAULT_BOARD_SORT.key && sort.ascending === DEFAULT_BOARD_SORT.ascending) return null;
  if (sort.ascending === naturalAscending(sort.key)) return sort.key;
  return `${sort.key}-${sort.ascending ? 'asc' : 'desc'}`;
}

/** Signed market-wide changes over the trailing windows; each null while gated or without a prior release. */
interface MarketChanges {
  day1: number | null;
  day7: number | null;
  day30: number | null;
  day90: number | null;
}

/** Market-wide summary shown in the Board lead. */
export interface MarketSummary {
  totalOpen: number;
  companyCount: number;
  changes: MarketChanges;
  /** Boards with open roles and at least `GATING_DAYS` releases whose count today equals or beats every release in the last 90 days, or null when gated. */
  atHigh90: number | null;
  /** Share of all open roles held by the ten largest boards, as an integer percent. */
  topTenShare: number;
}

/** One ranked company row in the company table. */
export interface BoardCompany {
  rank: number;
  slug: string;
  name: string;
  /** Sector slug, e.g. `fintech`. */
  sector: string;
  /** Human-readable sector label, e.g. `Fintech`. */
  sectorLabel: string;
  open: number;
  /** Signed 7-day change in open roles, or null when gated or without a release that old. */
  delta7d: number | null;
  /** Signed 30-day change in open roles, or null when gated or without a release that old. */
  delta30d: number | null;
}

/** Response shape of `GET /api/board`. */
export interface BoardResponse {
  market: MarketSummary;
  companies: BoardCompany[];
  /** MAX(snapshot_date) as an ISO date, or null before the first release (day zero). */
  updatedAt: string | null;
}
