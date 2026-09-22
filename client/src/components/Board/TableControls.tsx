import React, { useEffect, useRef, useState } from 'react';

import { useFilterStore } from '../../store/filterStore';

import { DURATION, EASING } from '../../constants/animations';

/** Idle time (ms) before a keystroke commits to shared state, so the table re-sorts once per pause. */
const SEARCH_DEBOUNCE_MS = 200;

/** One sector option for the select. */
export interface SectorOption {
  slug: string;
  label: string;
}

interface TableControlsProps {
  /** The sectors present on the board, in display order. */
  sectors: SectorOption[];
}

/**
 * The company table's controls, on the caption row: a sector select and a company search, each drawn as
 * text on a hairline. Typing updates a local draft and commits once typing pauses; pressing
 * "/" anywhere on the page focuses the search.
 * @param props - The sector options
 * @returns The controls
 */
export const TableControls: React.FC<TableControlsProps> = ({ sectors }) => {
  const sector = useFilterStore((s) => s.sector);
  const setSector = useFilterStore((s) => s.setSector);
  const search = useFilterStore((s) => s.search);
  const setSearch = useFilterStore((s) => s.setSearch);
  const [draft, setDraft] = useState(search);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reflect external changes to the committed value (URL load) into the field.
  useEffect(() => {
    setDraft(search);
  }, [search]);

  // Commit the draft once typing pauses; a new keystroke cancels the pending commit.
  useEffect(() => {
    if (draft === search) return;
    const id = setTimeout(() => setSearch(draft), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [draft, search, setSearch]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const target = event.target;
      const typing = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
      if (event.key === '/' && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
      <label className="inline-flex h-[34px] items-center gap-2 border-b border-line text-[13px] text-ink-2">
        <span>Sector</span>
        <select
          value={sector ?? ''}
          onChange={(event) => setSector(event.target.value === '' ? null : event.target.value)}
          aria-label="Sector"
          className="select-plain cursor-pointer border-0 bg-transparent pr-4 text-[13px] text-ink transition-colors hover:text-ink-2"
          style={{ transitionDuration: `${DURATION.normal}ms`, transitionTimingFunction: EASING }}
        >
          <option value="">All</option>
          {sectors.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="inline-flex h-[34px] items-center gap-2 border-b border-line text-[13px] text-ink-2">
        <input
          ref={inputRef}
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Find a company"
          aria-label="Find a company"
          className="w-[170px] border-0 bg-transparent text-[13px] text-ink placeholder:text-ink-3"
        />
        <kbd className="border border-line px-[5px] font-sans text-[11px] leading-4 text-ink-3">/</kbd>
      </label>
    </div>
  );
};
