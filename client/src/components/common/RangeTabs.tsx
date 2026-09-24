import React, { useRef } from 'react';

import { INDICATOR_BASE_WIDTH, useSlidingIndicator } from '../../hooks/useSlidingIndicator';

import { TRANSITION } from '../../constants/animations';

/** One selectable tab. */
export interface RangeTab {
  /** Stable key, also the `data-tab` hook the indicator measures against. */
  key: string;
  label: string;
}

interface RangeTabsProps {
  tabs: RangeTab[];
  /** Key of the active tab. */
  value: string;
  onChange: (key: string) => void;
  /** Accessible name for the group. */
  ariaLabel: string;
}

/**
 * A row of text tabs on a hairline with one ink underline that slides to the active word, purely
 * presentational since the parent slices the series.
 * @param props - The tabs, the active key, its change handler, and the group's accessible name
 * @returns The tab row
 */
export const RangeTabs: React.FC<RangeTabsProps> = ({ tabs, value, onChange, ariaLabel }) => {
  const ref = useRef<HTMLDivElement>(null);
  const transform = useSlidingIndicator(ref, value);

  return (
    <div ref={ref} role="group" aria-label={ariaLabel} className="relative inline-flex h-[34px] gap-[22px] border-b border-line">
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            data-tab={tab.key}
            aria-pressed={active}
            onClick={() => onChange(tab.key)}
            className={`-mb-px whitespace-nowrap border-b-2 border-transparent text-[13px] font-medium transition-colors hover:text-ink ${
              active ? 'text-ink' : 'text-ink-2'
            }`}
            style={TRANSITION}
          >
            {tab.label}
          </button>
        );
      })}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-px left-0 h-[2px] origin-left bg-ink transition-transform"
        style={{ width: INDICATOR_BASE_WIDTH, transform, ...TRANSITION }}
      />
    </div>
  );
};
