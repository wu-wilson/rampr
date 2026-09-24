import type { BoardSort, BoardSortKey } from '../types/board';

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
