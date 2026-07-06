import React, { useEffect, useState } from 'react';

import { DURATION } from '../../constants/animations';

/** Idle time (ms) before a keystroke commits to shared state — one board fetch per pause, not per keystroke. */
const SEARCH_DEBOUNCE_MS = 250;

interface SearchInputProps {
  /** The committed search from shared state (also reflects URL loads and cleared filters). */
  value: string;
  /** Commit a new search to shared state; called once the user pauses typing. */
  onChange: (value: string) => void;
}

/**
 * The Board company-search field with a leading magnifier icon. Keystrokes update a local draft
 * so the field stays responsive, then commit to shared state once typing pauses — so the board
 * fetches once per pause, not per keystroke. External changes to `value` flow back into the field.
 * @param props - The committed search value and its debounced commit callback
 * @returns The search input
 */
export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange }) => {
  const [draft, setDraft] = useState(value);

  // Reflect external changes to the committed value (URL load, cleared filters) into the field.
  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Commit the draft once typing pauses; a new keystroke cancels the pending commit.
  useEffect(() => {
    if (draft === value) return;
    const id = setTimeout(() => onChange(draft), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [draft, value, onChange]);

  return (
    <div className="relative w-full md:w-[340px]">
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-muted-3"
      >
        <circle cx="7" cy="7" r="4.5" />
        <line x1="10.5" y1="10.5" x2="14" y2="14" />
      </svg>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="search company"
        aria-label="search company"
        className="w-full border border-line-4 bg-paper py-2.5 pl-9 pr-3.5 font-mono text-ink transition-colors placeholder:text-muted-3 focus:border-brand text-[12px]"
        style={{ transitionDuration: `${DURATION.fast}ms` }}
      />
    </div>
  );
};
