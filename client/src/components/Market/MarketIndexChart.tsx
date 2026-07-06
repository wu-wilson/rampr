import React from 'react';

import { GatedTrend } from '../common/GatedTrend';
import { MonoLabel } from '../common/MonoLabel';
import { TrendBars } from '../common/TrendBars';

import { formatCount, formatDate } from '../../lib/format';

import type { IndexPoint, MarketIndex } from '../../types/market';

interface MarketIndexChartProps {
  /** The index series: the gated flag plus up to 90 days of daily totals. */
  index: MarketIndex;
}

/**
 * The market hiring index: total open roles across every tracked company per day. Renders
 * the shared "trend building" panel while globally gated; once live, the d3-scaled
 * {@link TrendBars} chart with value + time axes and the most recent day in full brand.
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

/** The live index: a d3-scaled bar chart of daily market totals with value + time axes and a tooltip. */
const IndexBars: React.FC<{ points: IndexPoint[] }> = ({ points }) => {
  const first = points[0];
  const latest = points[points.length - 1];
  const summary =
    first && latest
      ? `Total open roles per day over ${points.length} days: ${formatCount(first.totalOpen)} on ${formatDate(first.date)}, ${formatCount(latest.totalOpen)} today.`
      : 'Total open roles per day.';

  return (
    <div>
      <TrendBars
        points={points.map((p) => ({ date: p.date, value: p.totalOpen }))}
        heightClass="h-[180px] md:h-[240px]"
        ariaLabel={summary}
      />
    </div>
  );
};
