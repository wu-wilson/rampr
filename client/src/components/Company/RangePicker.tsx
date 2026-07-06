import React from 'react';

import { DURATION } from '../../constants/animations';

/** Number of trailing days a trajectory range shows. */
export type TrajectoryRange = 14 | 30 | 90;

/** The selectable ranges, shortest first. */
const RANGES: TrajectoryRange[] = [14, 30, 90];

interface RangePickerProps {
  /** The currently-selected trailing-day window. */
  value: TrajectoryRange;
  /** Called with the newly-selected window when a segment is clicked. */
  onChange: (range: TrajectoryRange) => void;
}

/**
 * The 14 / 30 / 90-day range toggle for the trajectory chart, a hairline-boxed row of mono
 * segments with the active one filled in ink. Purely presentational — the parent slices
 * the point series client-side to the chosen window.
 * @param props - The active range and its change handler
 * @returns The range toggle
 */
export const RangePicker: React.FC<RangePickerProps> = ({ value, onChange }) => (
  <div className="inline-flex gap-0.5 border border-line-4 p-0.5">
    {RANGES.map((range) => {
      const active = range === value;
      return (
        <button
          key={range}
          type="button"
          onClick={() => onChange(range)}
          aria-pressed={active}
          className={`px-1.5 py-1 font-mono text-[9px] uppercase transition-colors md:px-2 md:text-[10px] tracking-[0.06em] ${
            active ? 'bg-ink-strong text-paper' : 'text-muted-2 hover:text-ink'
          }`}
          style={{ transitionDuration: `${DURATION.fast}ms` }}
        >
          {range}D
        </button>
      );
    })}
  </div>
);
