import React from 'react';

import { useFilterStore } from '../../store/filterStore';

import { TRANSITION } from '../../constants/animations';

import type { BoardSortKey } from '../../types/board';

/** The company table's grid: rank, company, sector, postings, 7 days, 30 days, inset 16px from the rule ends from `md` and set at the gutter below it, where the rules run edge to edge. Sector and 30 days hide on phones. */
export const BOARD_COLUMNS =
  'grid-cols-[28px_minmax(0,1fr)_64px_56px] px-5 md:grid-cols-[32px_minmax(0,1fr)_120px_100px_100px_100px] md:px-4';

interface SortButtonProps {
  column: BoardSortKey;
  label: string;
  /** Right-align numeric columns. */
  right?: boolean;
  /** Extra classes, e.g. to hide the column on phones. */
  className?: string;
}

/** A sortable column header: the label with a small chevron that appears on the active column and turns when the order flips. */
const SortButton: React.FC<SortButtonProps> = ({ column, label, right, className }) => {
  const sort = useFilterStore((s) => s.sort);
  const toggleSort = useFilterStore((s) => s.toggleSort);
  const active = sort.key === column;
  const chevron = (
    <svg
      viewBox="0 0 10 10"
      aria-hidden="true"
      className={`h-[10px] w-[10px] transition-[opacity,transform] ${active ? 'opacity-100' : 'opacity-0'} ${
        active && sort.ascending ? 'rotate-180' : ''
      }`}
      style={TRANSITION}
    >
      <path d="M2.5 4 5 6.5 7.5 4" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <button
      type="button"
      onClick={() => toggleSort(column)}
      aria-label={active ? `Sort by ${label}, ${sort.ascending ? 'ascending' : 'descending'}` : `Sort by ${label}`}
      aria-pressed={active}
      className={`inline-flex items-center gap-1 self-stretch transition-colors focus-visible:relative focus-visible:z-[1] ${active ? 'text-ink hover:text-ink-2' : 'hover:text-ink'} ${
        right ? 'justify-end' : ''
      } ${className ?? ''}`}
      style={TRANSITION}
    >
      {right && chevron}
      {label}
      {!right && chevron}
    </button>
  );
};

/**
 * The company table's header row: rank, sector, and the four sortable columns.
 * @returns The header row
 */
export const TableHeader: React.FC = () => (
  <div className={`grid h-[38px] items-center gap-3.5 border-y border-line text-[12px] font-medium text-ink-3 ${BOARD_COLUMNS}`}>
    <span className="text-right">Rank</span>
    <SortButton column="name" label="Company" />
    <span className="hidden md:block">Sector</span>
    <SortButton column="open" label="Postings" right />
    <SortButton column="d7" label="7 days" right />
    <SortButton column="d30" label="30 days" right className="hidden md:inline-flex" />
  </div>
);
