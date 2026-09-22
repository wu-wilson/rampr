import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { GatedPanel } from '../common/GatedPanel';
import { LineChart } from '../common/LineChart';

import { useElementSize } from '../../hooks/useElementSize';

import { chartHeight } from '../../lib/chart';
import { formatCount, formatDate } from '../../lib/format';

import { HERO_RELEASES } from '../../constants/config';

import type { MarketIndex } from '../../types/market';

interface HeroChartProps {
  /** The market index, or null while it is still loading or after a failed load. */
  index: MarketIndex | null;
  /** True when the index could not be read, so the chart slot says so. */
  failed: boolean;
}

/** Plot height (px) of the hero chart. */
const HEIGHT = 250;
/** The least vertical padding, in postings, around the hero line. */
const MIN_PAD = 100;

/**
 * The hero chart: the last `HERO_RELEASES` releases of the market total, in the hero's right panel, with a link to
 * the full series. Holds the chart's height while the index loads, says so if the index cannot be read,
 * and shows the building panel while the index is gated.
 * @param props - The market index and whether it failed to load
 * @returns The chart panel content
 */
export const HeroChart: React.FC<HeroChartProps> = ({ index, failed }) => {
  const [ref, { width }] = useElementSize<HTMLDivElement>();
  const points = useMemo(
    () => (index ? index.points.slice(-HERO_RELEASES).map((point) => ({ date: point.date, value: point.totalOpen })) : []),
    [index],
  );
  const first = points[0];
  const last = points[points.length - 1];
  const live = index !== null && !index.gated;

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
      <div ref={ref}>
        {index === null ? (
          <div className="flex items-center justify-center text-[12.5px] text-ink-3" style={{ height: chartHeight(width, HEIGHT) }}>
            {failed && 'The series could not be read this time.'}
          </div>
        ) : !live ? (
          <GatedPanel daysTracked={index.daysTracked} label="The series" note="Every count is already live." framed={false} />
        ) : (
          <LineChart
            points={points}
            height={HEIGHT}
            minPad={MIN_PAD}
            ariaLabel={`Open postings across all boards over the last ${points.length} releases: ${formatCount(first.value)} on ${formatDate(first.date)}, ${formatCount(last.value)} on ${formatDate(last.date)}.`}
          />
        )}
      </div>
      {live && (
        <div className="text-[12.5px] text-ink-3">Each point is the sum of the boards read at that morning’s release. The shaded columns are weekends.</div>
      )}
    </>
  );
};
