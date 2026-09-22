import React, { useEffect, useMemo, useState } from 'react';

import { Caption } from '../common/Caption';
import { GatedPanel } from '../common/GatedPanel';
import { LineChart } from '../common/LineChart';
import { RangeTabs, type RangeTab } from '../common/RangeTabs';

import { formatCount, formatDate } from '../../lib/format';
import { prefersReducedMotion } from '../../lib/motion';

import { DURATION, EASING } from '../../constants/animations';

import type { SeriesPoint } from '../../lib/series';
import type { Trajectory } from '../../types/company';

interface TrajectorySectionProps {
  /** The company name, for the accessible summary. */
  name: string;
  trajectory: Trajectory;
  /** The trajectory as a plain series, oldest first. */
  series: SeriesPoint[];
}

/** Plot height (px) and the least vertical padding, in postings, around the line. */
const HEIGHT = 280;
const MIN_PAD = 8;
/** The trailing windows offered, in releases labelled as days, shortest first with "all" after; unrelated to the gating threshold. */
const WINDOWS = [14, 30];

/**
 * The company chart: the company's open postings per release over the chosen window, with range
 * tabs for each window shorter than the series and a crossfade between them. Shows the building
 * panel while the company's changes are gated.
 * @param props - The company name, its trajectory, and the series
 * @returns The chart section
 */
export const TrajectorySection: React.FC<TrajectorySectionProps> = ({ name, trajectory, series }) => {
  const [range, setRange] = useState('all');
  const [shownRange, setShownRange] = useState('all');
  const [fading, setFading] = useState(false);

  // Crossfade: fade the plot out, swap the window while it is invisible, fade back in.
  useEffect(() => {
    if (range === shownRange) {
      setFading(false);
      return;
    }
    if (prefersReducedMotion()) {
      setShownRange(range);
      return;
    }
    setFading(true);
    const id = window.setTimeout(() => {
      setShownRange(range);
      setFading(false);
    }, DURATION.normal);
    return () => window.clearTimeout(id);
  }, [range, shownRange]);

  const tabs = useMemo<RangeTab[]>(
    () => [
      ...WINDOWS.filter((days) => days < series.length).map((days) => ({ key: String(days), label: `${days} days` })),
      { key: 'all', label: 'All' },
    ],
    [series.length],
  );
  const points = useMemo(() => (shownRange === 'all' ? series : series.slice(-Number(shownRange))), [series, shownRange]);
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div>
      <Caption title="Open postings, daily">
        {!trajectory.gated && <RangeTabs tabs={tabs} value={range} onChange={setRange} ariaLabel="Chart range" />}
      </Caption>
      {trajectory.gated ? (
        <GatedPanel daysTracked={trajectory.daysTracked} label="The trend" note="Every count is already live." />
      ) : (
        <>
          <div className={`transition-opacity ${fading ? 'opacity-0' : 'opacity-100'}`} style={{ transitionDuration: `${DURATION.normal}ms`, transitionTimingFunction: EASING }}>
            <LineChart
              points={points}
              height={HEIGHT}
              minPad={MIN_PAD}
              ariaLabel={`${name} open postings per release over ${points.length} releases: ${formatCount(first.value)} on ${formatDate(first.date)}, ${formatCount(last.value)} on ${formatDate(last.date)}.`}
            />
          </div>
          <p className="mt-2 text-[12.5px] text-ink-3">The vertical axis is fitted to the series. The shaded columns are weekends.</p>
        </>
      )}
    </div>
  );
};
