import React from 'react';

import { Band } from '../common/Band';
import { EmptyState } from '../common/EmptyState';
import { StatusNote } from '../common/StatusNote';
import { MarketIndexChart } from './MarketIndexChart';
import { MoversStrip } from './MoversStrip';
import { SectorBars } from './SectorBars';

import { useMarket } from '../../hooks/useMarket';

import { formatCount } from '../../lib/format';

/**
 * The Market screen: a by-sector hero, then open roles by sector beside the market hiring
 * index, then the heating/cooling movers. Sector totals are always live; the index and
 * movers are gated until 14 daily snapshots exist. Renders designed loading, error, and
 * day-zero states.
 * @returns The Market screen
 */
export const MarketScreen: React.FC = () => {
  const { market, loading, error } = useMarket();

  if (!market) {
    return (
      <StatusNote>{loading ? 'Reading the market…' : (error ?? 'Something went wrong.')}</StatusNote>
    );
  }

  if (market.totals.updatedAt === null) {
    return (
      <EmptyState
        title="Tracking just started"
        body="rampr hasn't completed its first daily poll yet. Once it counts the boards, the sector totals, market index, and movers will appear here."
      />
    );
  }

  const { totals } = market;

  return (
    <div>
      <Band className="pb-5 pt-6 md:pb-[30px] md:pt-[38px]">
        <h1
          className="font-display font-extrabold text-ink"
          style={{ fontSize: 'clamp(25px, 6vw, 34px)', letterSpacing: '-0.03em', lineHeight: 1.05 }}
        >
          The market, by sector.
        </h1>
        <p className="mt-1.5 font-mono text-[11px] text-muted-1 md:mt-2 md:text-[12px]">
          {formatCount(totals.totalOpen)} open roles
          <span className="hidden md:inline"> across {formatCount(totals.companyCount)} companies</span> ·{' '}
          {formatCount(totals.sectorCount)} sectors
        </p>
      </Band>

      <Band>
        <div className="-mx-5 grid md:-mx-10 md:grid-cols-2">
          <div className="border-b border-line-2 px-5 py-[22px] md:border-b-0 md:border-r md:px-10 md:py-7">
            <SectorBars sectors={market.sectors} />
          </div>
          <div className="px-5 py-[22px] md:px-10 md:py-7">
            <MarketIndexChart index={market.index} />
          </div>
        </div>
      </Band>

      <Band divider={false}>
        <MoversStrip movers={market.movers} daysTracked={market.index.daysTracked} />
      </Band>
    </div>
  );
};
