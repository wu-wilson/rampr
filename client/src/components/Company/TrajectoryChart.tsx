import React, { useMemo, useState } from 'react';

import { Band } from '../common/Band';
import { GatedTrend } from '../common/GatedTrend';
import { RangePicker } from './RangePicker';

import { formatCount, formatDate, formatDayMonth } from '../../lib/format';

import type { TrajectoryRange } from './RangePicker';
import type { Trajectory, TrajectoryPoint } from '../../types/company';

interface TrajectoryChartProps {
  /** The trajectory series: the gated flag plus up to 90 daily points. */
  trajectory: Trajectory;
}

/**
 * The company's open-role trajectory band. When gated it shows the shared "trend building"
 * panel; once live it draws hand-rolled CSS bars over the chosen 14 / 30 / 90-day window
 * (sliced client-side), the most recent bar in full brand and the rest in the soft ramp.
 * @param props - The trajectory series (gated flag + daily points)
 * @returns The trajectory band
 */
export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({ trajectory }) => {
  const [range, setRange] = useState<TrajectoryRange>(14);

  const points = useMemo<TrajectoryPoint[]>(
    () => trajectory.points.slice(-range),
    [trajectory.points, range],
  );
  const max = useMemo(() => Math.max(1, ...points.map((p) => p.count)), [points]);

  return (
    <Band className="py-[22px] md:py-[30px]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-[14px] font-bold text-ink md:text-[15px]">
          Open roles over time
        </h2>
        {trajectory.gated ? (
          <span className="hidden font-mono text-muted-3 md:inline" style={{ fontSize: '11px' }}>
            one snapshot per day · no backfill
          </span>
        ) : (
          <div className="flex items-center gap-3.5">
            <RangePicker value={range} onChange={setRange} />
            <span className="hidden font-mono text-muted-3 md:inline" style={{ fontSize: '11px' }}>
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
        <Bars points={points} max={max} />
      )}
    </Band>
  );
};

/** The bar plot with first-date and today labels beneath it. */
const Bars: React.FC<{ points: TrajectoryPoint[]; max: number }> = ({ points, max }) => {
  const latest = points[points.length - 1];

  return (
    <div className="mt-4 md:mt-[22px]">
      <div className="flex h-[90px] items-end gap-[3px] md:h-[140px]">
        {points.map((point, index) => {
          const isLatest = index === points.length - 1;
          const heightPct = Math.max(3, (point.count / max) * 100);
          return (
            <div
              key={point.date}
              className={`animate-bar-rise flex-1 ${isLatest ? 'bg-brand' : 'bg-brand-soft'}`}
              style={{ height: `${heightPct}%` }}
              title={`${formatDate(point.date)} · ${formatCount(point.count)} open`}
            />
          );
        })}
      </div>
      <div
        className="mt-2 flex justify-between font-mono uppercase text-muted-3"
        style={{ fontSize: '10px', letterSpacing: '0.04em' }}
      >
        <span>{points.length > 0 ? formatDayMonth(points[0].date) : ''}</span>
        <span>{latest ? `Today · ${formatCount(latest.count)}` : ''}</span>
      </div>
    </div>
  );
};
