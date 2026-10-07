import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { GatedPanel } from '../common/GatedPanel';
import { LineChart } from '../common/LineChart';

import { formatCount, formatDate } from '../../lib/format';

import { HERO_RELEASES } from '../../constants/config';

import type { MarketIndex } from '../../types/market';

/** The least vertical padding, in postings, around the hero line. */
const MIN_PAD = 100;

interface HeroChartProps {
  /** The market index, or null while it is still loading or after a failed load. */
  index: MarketIndex | null;
  /** True when the index could not be read, so the chart slot says so. */
  failed: boolean;
}

/**
 * The hero chart: the last `HERO_RELEASES` market totals filling its panel, or a loading, failed, or building state.
 * @param props - The market index and whether it failed to load
 * @returns The chart panel content
 */
export const HeroChart: React.FC<HeroChartProps> = ({ index, failed }) => {
  const points = useMemo(
    () => (index ? index.points.slice(-HERO_RELEASES).map((point) => ({ date: point.date, value: point.totalOpen })) : []),
    [index],
  );
  const first = points[0];
  const last = points[points.length - 1];
  const live = index !== null && !index.gated;

  // The plot's least height is CSS rather than measured, so the hero's snapping always reads it current.
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[14px] font-medium">Open postings across all boards</h2>
        <span className="text-[12.5px] text-ink-3">
          {live && `Last ${formatCount(points.length)} releases. `}
          <Link to="/market" className="link">
            See the full series
          </Link>
        </span>
      </div>
      <div className="relative flex min-h-[180px] flex-1 flex-col justify-center sm:min-h-[250px] lg:min-h-[180px]">
        {index === null ? (
          <p className="text-center text-[12.5px] text-ink-3">{failed ? 'The series could not be read this time.' : 'Reading the series.'}</p>
        ) : !live ? (
          <GatedPanel daysTracked={index.daysTracked} label="The series" note="Every count is already live." framed={false} />
        ) : (
          <LineChart
            points={points}
            height="fill"
            minPad={MIN_PAD}
            ariaLabel={`Open postings across all boards over the last ${points.length} releases: ${formatCount(first.value)} on ${formatDate(first.date)}, ${formatCount(last.value)} on ${formatDate(last.date)}.`}
          />
        )}
      </div>
      {live && (
        <div className="text-[12.5px] text-ink-3">Each point sums every board’s latest count as of that morning’s release. The shaded columns are weekends.</div>
      )}
    </>
  );
};
