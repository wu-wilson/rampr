import React, { useMemo, useState } from 'react';

import { Band } from '../common/Band';
import { GatedTrend } from '../common/GatedTrend';
import { TrendBars } from '../common/TrendBars';
import { RangePicker } from './RangePicker';

import { formatCount, formatDate } from '../../lib/format';

import type { TrajectoryRange } from './RangePicker';
import type { Trajectory, TrajectoryPoint } from '../../types/company';

interface TrajectoryChartProps {
  /** The trajectory series: the gated flag plus up to 90 daily points. */
  trajectory: Trajectory;
}

/**
 * The company's open-role trajectory band. When gated it shows the shared "trend building"
 * panel; once live it renders the d3-scaled {@link TrendBars} chart over the chosen 14 / 30 /
 * 90-day window (sliced client-side), with value + time axes and the most recent bar in full brand.
 * @param props - The trajectory series (gated flag + daily points)
 * @returns The trajectory band
 */
export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({ trajectory }) => {
  const [range, setRange] = useState<TrajectoryRange>(14);

  const points = useMemo<TrajectoryPoint[]>(
    () => trajectory.points.slice(-range),
    [trajectory.points, range],
  );

  return (
    <Band className="py-[22px] md:py-[30px]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-[14px] font-bold text-ink md:text-[15px]">
          Open roles over time
        </h2>
        {trajectory.gated ? (
          <span className="hidden font-mono text-muted-3 md:inline text-[11px]">
            one snapshot per day · no backfill
          </span>
        ) : (
          <div className="flex items-center gap-3.5">
            <RangePicker value={range} onChange={setRange} />
            <span className="hidden font-mono text-muted-3 md:inline text-[11px]">
              one snapshot / day
            </span>
          </div>
        )}
      </div>

      {trajectory.gated ? (
        <div className="mt-4 md:mt-[22px]">
          <GatedTrend
            daysTracked={trajectory.daysTracked}
            label="Trend"
            caption="unlocks at 14 days of history · today's count is already live"
          />
        </div>
      ) : (
        <Bars points={points} />
      )}
    </Band>
  );
};

/** The trajectory plot: a d3-scaled bar chart with value + time axes and a hover tooltip. */
const Bars: React.FC<{ points: TrajectoryPoint[] }> = ({ points }) => {
  const first = points[0];
  const latest = points[points.length - 1];
  const summary =
    first && latest
      ? `Open roles per day over ${points.length} days: ${formatCount(first.count)} on ${formatDate(first.date)}, ${formatCount(latest.count)} today.`
      : 'Open roles per day.';

  return (
    <div className="mt-4 md:mt-[22px]">
      <TrendBars
        points={points.map((p) => ({ date: p.date, value: p.count }))}
        heightClass="h-[160px] md:h-[200px]"
        ariaLabel={summary}
      />
    </div>
  );
};
