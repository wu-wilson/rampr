import React from 'react';

import { Band } from '../common/Band';
import { SectorChips } from './SectorChips';

import { useFilterStore } from '../../store/filterStore';

import { formatCount } from '../../lib/format';

import { DURATION } from '../../constants/animations';

import type { BoardSort } from '../../types/board';

const SORTS: Array<{ value: BoardSort; label: string }> = [
  { value: 'open', label: 'Most open' },
  { value: 'momentum', label: 'Ramping fastest' },
];

interface FilterBarProps {
  /** Companies in the current filtered board, shown in the mobile controls row. */
  companyCount: number;
}

/**
 * The Board controls band: a company search, the inline sector pills, and a sort control.
 * Above 760px the search sits left with the bordered sort facade pinned right and the sector
 * pills on a full-width row beneath; on mobile the search is full-width, the pills wrap, and a
 * final row pairs the company count (left) with a plain-mono "Sort: {label} ▾" tap target (right).
 * @param props - The filtered company count for the mobile controls row
 * @returns The controls band
 */
export const FilterBar: React.FC<FilterBarProps> = ({ companyCount }) => {
  const search = useFilterStore((s) => s.search);
  const setSearch = useFilterStore((s) => s.setSearch);
  const sort = useFilterStore((s) => s.sort);
  const setSort = useFilterStore((s) => s.setSort);

  const activeLabel = SORTS.find((option) => option.value === sort)?.label ?? SORTS[0].label;

  return (
    <Band className="flex flex-col gap-2.5 py-4 md:gap-3">
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:gap-3">
        <SearchInput value={search} onChange={setSearch} />
        <SortFacade
          value={sort}
          label={activeLabel}
          onChange={setSort}
          className="relative hidden md:ml-auto md:block"
        />
      </div>
      <SectorChips />
      <div className="flex items-center justify-between md:hidden">
        <span className="font-mono text-muted-1" style={{ fontSize: '11px' }}>
          {formatCount(companyCount)} companies
        </span>
        <SortText value={sort} label={activeLabel} onChange={setSort} />
      </div>
    </Band>
  );
};

/** The company search field with a leading search glyph. */
const SearchInput: React.FC<{ value: string; onChange: (value: string) => void }> = ({
  value,
  onChange,
}) => (
  <div className="relative w-full md:w-[340px]">
    <span
      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-muted-3"
      aria-hidden="true"
    >
      ⌕
    </span>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="search company"
      aria-label="search company"
      className="w-full border border-line-4 bg-paper py-2.5 pl-9 pr-3.5 font-mono text-ink transition-colors placeholder:text-muted-3 focus:border-brand"
      style={{ fontSize: '12px', transitionDuration: `${DURATION.fast}ms` }}
    />
  </div>
);

/** The desktop "Sort: {label} ▾" bordered facade over a transparent native select. */
const SortFacade: React.FC<{
  value: BoardSort;
  label: string;
  onChange: (value: BoardSort) => void;
  className?: string;
}> = ({ value, label, onChange, className }) => (
  <div className={className}>
    <div
      className="flex items-center gap-2 border border-line-4 bg-paper px-3.5 py-2.5 font-mono text-muted-1"
      style={{ fontSize: '11px' }}
      aria-hidden="true"
    >
      <span>
        Sort: <b className="font-semibold text-ink">{label}</b>
      </span>
      <span>▾</span>
    </div>
    <SortSelect value={value} onChange={onChange} />
  </div>
);

/** The mobile "Sort: {label} ▾" plain-mono tap target over a transparent native select. */
const SortText: React.FC<{
  value: BoardSort;
  label: string;
  onChange: (value: BoardSort) => void;
}> = ({ value, label, onChange }) => (
  <div className="relative">
    <span className="font-mono text-muted-1" style={{ fontSize: '11px' }} aria-hidden="true">
      Sort: <b className="font-semibold text-ink">{label}</b> ▾
    </span>
    <SortSelect value={value} onChange={onChange} />
  </div>
);

/** The transparent native select that overlays a sort facade and drives the sort filter. */
const SortSelect: React.FC<{ value: BoardSort; onChange: (value: BoardSort) => void }> = ({
  value,
  onChange,
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value === 'momentum' ? 'momentum' : 'open')}
    aria-label="Sort the board"
    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
  >
    {SORTS.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);
