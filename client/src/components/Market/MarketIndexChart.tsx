import React from 'react';

import { GatedTrend } from '../common/GatedTrend';
import { MonoLabel } from '../common/MonoLabel';

import { formatCount, formatDate, formatDayMonth } from '../../lib/format';

import type { IndexPoint, MarketIndex } from '../../types/market';

interface MarketIndexChartProps {
  /** The index series: the gated flag plus up to 90 days of daily totals. */
  index: MarketIndex;
}

/**
 * The market hiring index: total open roles across every tracked company per day. Renders
 * the shared "trend building" panel while globally gated; once live, hand-rolled CSS bars
 * with the most recent day in full brand and the rest in the soft ramp.
 * @param props - The index series (gated flag + daily totals)
 * @returns The market-index column
 */
export const MarketIndexChart: React.FC<MarketIndexChartProps> = ({ index }) => (
  <div>
    <div className="mb-3.5 flex items-center justify-between gap-3 md:mb-5">
      <MonoLabel>Market hiring index</MonoLabel>
      <span className="hidden font-mono text-muted-3 md:inline" style={{ fontSize: '11px' }}>
        total open roles / day
      </span>
    </div>
    {index.gated ? (
      <GatedTrend
        daysTracked={index.daysTracked}
        label="Index"
        caption="today's total is already live · history starts the day tracking began"
      />
    ) : (
      <IndexBars points={index.points} />
    )}
  </div>
);

/** The live index: one CSS bar per day, latest in full brand and the rest in the soft ramp. */
const IndexBars: React.FC<{ points: IndexPoint[] }> = ({ points }) => {
  const max = Math.max(1, ...points.map((p) => p.totalOpen));

  return (
    <div>
      <div className="flex h-[100px] items-end gap-[3px] md:h-[180px]">
        {points.map((point, i) => {
          const isLatest = i === points.length - 1;
          return (
            <div
              key={point.date}
              className={`animate-bar-rise flex-1 rounded-t-sm ${isLatest ? 'bg-brand' : 'bg-brand-soft'}`}
              style={{ height: `${Math.max(3, (point.totalOpen / max) * 100)}%` }}
              title={`${formatDate(point.date)} · ${formatCount(point.totalOpen)} open`}
            />
          );
        })}
      </div>
      <div className="mt-2 hidden justify-between font-mono uppercase text-muted-3 md:flex" style={{ fontSize: '10px', letterSpacing: '0.04em' }}>
        <span>{points.length > 0 ? formatDayMonth(points[0].date) : ''}</span>
        <span>{points.length > 0 ? `Today · ${formatCount(points[points.length - 1].totalOpen)}` : ''}</span>
      </div>
    </div>
  );
};
