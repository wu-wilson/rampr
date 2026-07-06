import React from 'react';

import { MonoLabel } from '../common/MonoLabel';

import { formatCount, formatPercent } from '../../lib/format';

import type { WorkMix, WorkMixSlice } from '../../types/company';

interface WorkMixBarProps {
  /** The company's remote / hybrid / onsite / unknown split. */
  workMix: WorkMix;
}

/** One segment of the work-mix bar, paired with a bar color and a legend label. */
interface Segment {
  key: string;
  label: string;
  /** Tailwind background token for the bar slice and legend swatch. */
  color: string;
  slice: WorkMixSlice;
}

/**
 * The remote / hybrid / onsite / unknown work-mix as a single stacked bar plus a legend
 * with each share's percent and count. The `unknown` residual appears only when its count
 * is greater than zero. Renders the inner content of the breakdowns band's last cell.
 * Snapshot data, always live — never gated.
 * @param props - The company's work-mix shares
 * @returns The work-mix cell
 */
export const WorkMixBar: React.FC<WorkMixBarProps> = ({ workMix }) => {
  const segments: Segment[] = [
    { key: 'remote', label: 'Remote', color: 'bg-brand', slice: workMix.remote },
    { key: 'hybrid', label: 'Hybrid', color: 'bg-brand-soft', slice: workMix.hybrid },
    { key: 'onsite', label: 'Onsite', color: 'bg-line-3', slice: workMix.onsite },
    ...(workMix.unknown.count > 0
      ? [{ key: 'unknown', label: 'Unknown', color: 'bg-muted-3', slice: workMix.unknown }]
      : []),
  ];

  return (
    <div>
      <MonoLabel className="mb-3 block md:mb-[18px]">Work mix</MonoLabel>

      <div className="flex h-3 overflow-hidden md:h-3.5">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={segment.color}
            style={{ width: `${segment.slice.pct}%` }}
            title={`${segment.label} · ${formatPercent(segment.slice.pct)}`}
          />
        ))}
      </div>

      {/* Desktop legend: swatch + label + percent · count, one row each. */}
      <ul className="mt-4 hidden flex-col gap-2.5 md:flex">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center justify-between" style={{ fontSize: '12px' }}>
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 ${segment.color}`} aria-hidden="true" />
              <span className="text-ink">{segment.label}</span>
            </span>
            <span className="font-mono tabular-nums text-muted-1">
              {formatPercent(segment.slice.pct)} · {formatCount(segment.slice.count)}
            </span>
          </li>
        ))}
      </ul>

      {/* Mobile legend: a single compact row of label + percent. */}
      <div
        className="mt-2.5 flex justify-between font-mono tabular-nums text-muted-1 md:hidden"
        style={{ fontSize: '10px' }}
      >
        {segments.map((segment) => (
          <span key={segment.key}>
            {segment.label} {formatPercent(segment.slice.pct)}
          </span>
        ))}
      </div>
    </div>
  );
};
