import React from 'react';

import { Band } from '../common/Band';
import { SearchInput } from './SearchInput';
import { SectorChips } from './SectorChips';

import { useFilterStore } from '../../store/filterStore';

import { formatCount } from '../../lib/format';

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
        <span className="font-mono text-muted-1 text-[11px]">
          {formatCount(companyCount)} companies
        </span>
        <SortText value={sort} label={activeLabel} onChange={setSort} />
      </div>
    </Band>
  );
};

/** The desktop "Sort: {label} ▾" bordered facade over a transparent native select; because the select is invisible, the facade surfaces its keyboard focus ring. */
const SortFacade: React.FC<{
  value: BoardSort;
  label: string;
  onChange: (value: BoardSort) => void;
  className?: string;
}> = ({ value, label, onChange, className }) => (
  <div className={`group ${className ?? ''}`}>
    <div
      className="flex items-center gap-2 border border-line-4 bg-paper px-3.5 py-2.5 font-mono text-muted-1 transition-shadow group-has-[:focus-visible]:ring-1 group-has-[:focus-visible]:ring-ink/60 text-[11px]"
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

/** The mobile "Sort: {label} ▾" plain-mono tap target over a transparent native select; the label underlines while the select is keyboard-focused. */
const SortText: React.FC<{
  value: BoardSort;
  label: string;
  onChange: (value: BoardSort) => void;
}> = ({ value, label, onChange }) => (
  <div className="group relative">
    <span
      className="font-mono text-muted-1 underline-offset-4 group-has-[:focus-visible]:underline text-[11px]"
      aria-hidden="true"
    >
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
