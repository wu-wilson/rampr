import React, { useMemo } from 'react';

import { BreadthChart } from '../common/BreadthChart';
import { Caption } from '../common/Caption';
import { EmptyState } from '../common/EmptyState';
import { GatedPanel } from '../common/GatedPanel';
import { LineChart } from '../common/LineChart';
import { Rail } from '../common/Rail';
import { Reveal } from '../common/Reveal';
import { StatusNote } from '../common/StatusNote';
import { MoversTables } from './MoversTables';
import { SectorTable } from './SectorTable';

import { useMarket } from '../../hooks/useMarket';
import { useMediaQuery } from '../../hooks/useMediaQuery';

import { formatCount, formatDate, formatReleaseTimeLocal, formatReleaseTimeUtc, formatSpokenDate } from '../../lib/format';

import { NARROW_BREADTH_RELEASES, PHONE_QUERY } from '../../constants/config';

/** Plot heights (px) and the least vertical padding, in postings, around the full series. */
const INDEX_HEIGHT = 320;
const INDEX_MIN_PAD = 200;
const BREADTH_HEIGHT = 150;

/**
 * The Market screen: the full series chart, the breadth chart (the last `NARROW_BREADTH_RELEASES`
 * releases on phones), then the sector table and the movers tables, side by side when the rail has
 * room. Sector totals are always live, while the charts and changes are gated until `GATING_DAYS`
 * releases exist.
 * @returns The Market screen
 */
export const MarketScreen: React.FC = () => {
  const { market, loading, error } = useMarket();
  const narrow = useMediaQuery(PHONE_QUERY);
  const index = useMemo(() => (market ? market.index.points.map((point) => ({ date: point.date, value: point.totalOpen })) : []), [market]);
  const breadth = useMemo(() => {
    const points = market ? market.breadth.points : [];
    return narrow ? points.slice(-NARROW_BREADTH_RELEASES) : points;
  }, [market, narrow]);

  if (!market) {
    return <StatusNote>{loading ? 'Reading the release.' : (error ?? 'Something went wrong.')}</StatusNote>;
  }
  if (market.totals.updatedAt === null) {
    return (
      <EmptyState
        title="Before the first release"
        body="Rampr has not counted its first morning yet. The series starts here once it does."
        note={`First release at ${formatReleaseTimeUtc()}, ${formatReleaseTimeLocal()} locally.`}
      />
    );
  }

  const first = index[0];
  const last = index[index.length - 1];
  const live = !market.index.gated;

  return (
    <Rail className="pb-24">
      <h1 className="sr-only">Market</h1>
      <Reveal className="pt-14">
        <Caption title={first ? `Open postings across all boards since ${formatSpokenDate(first.date)}` : 'Open postings across all boards'} />
        {live ? (
          <>
            <LineChart
              points={index}
              height={INDEX_HEIGHT}
              minPad={INDEX_MIN_PAD}
              ariaLabel={`Open postings across all boards per release: ${formatCount(first.value)} on ${formatDate(first.date)}, ${formatCount(last.value)} on ${formatDate(last.date)}.`}
            />
            <p className="mt-2 text-[12.5px] text-ink-3">One point for each of the last {formatCount(index.length)} releases. The shaded columns are weekends.</p>
          </>
        ) : (
          <GatedPanel daysTracked={market.index.daysTracked} label="The series" note="Every count is already live." />
        )}
      </Reveal>

      <Reveal className="pt-14">
        <Caption title="Boards rising minus boards falling, each release" />
        {live ? (
          <>
            <BreadthChart
              points={breadth}
              height={BREADTH_HEIGHT}
              ariaLabel={`Boards that added postings minus boards that removed them, for each of the last ${breadth.length} releases.`}
            />
            <p className="mt-2 text-[12.5px] text-ink-3">
              {narrow && breadth.length < market.breadth.points.length && `The last ${NARROW_BREADTH_RELEASES} releases. `}A reading above
              zero means more boards added postings than removed them that day.
            </p>
          </>
        ) : (
          <GatedPanel daysTracked={market.index.daysTracked} label="Breadth" note="It compares each release with the one before." />
        )}
      </Reveal>

      {/* Side by side only once each table can have 520px, the least the sector names and movers need. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,520px),1fr))] gap-x-12">
        <Reveal className="pt-14">
          <Caption title="Open postings by sector" />
          <SectorTable sectors={market.sectors} totalOpen={market.totals.totalOpen} />
        </Reveal>
        <Reveal className="pt-14">
          <Caption title="Largest seven-day changes" />
          <MoversTables movers={market.movers} daysTracked={market.index.daysTracked} />
        </Reveal>
      </div>
    </Rail>
  );
};
