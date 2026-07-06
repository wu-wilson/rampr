import React from 'react';

import { Band } from '../common/Band';
import { MomentumArrow } from '../common/MomentumArrow';
import { MonoLabel } from '../common/MonoLabel';

import { useMarket } from '../../hooks/useMarket';

import { formatCount, formatDelta } from '../../lib/format';
import { gatingLabel } from '../../lib/gating';
import { momentumView } from '../../lib/momentum';

import type { MarketSummary } from '../../types/board';

interface MarketHeadlineProps {
  /** Market-wide totals and 7-day trend gating for the hero stat card. */
  market: MarketSummary;
}

/**
 * The Board hero: an editorial headline and lede on the left, and a bordered market
 * stat card on the right holding the market-wide open-role total, company/sector counts,
 * and a trend line that reads as a gated "N of 14" caption until the market unlocks.
 * @param props - The market summary driving the stat card
 * @returns The hero band
 */
export const MarketHeadline: React.FC<MarketHeadlineProps> = ({ market }) => (
  <Band className="grid gap-[18px] pb-[22px] pt-[26px] md:grid-cols-[1fr_340px] md:gap-10 md:pb-9 md:pt-11">
    <div>
      <h1
        className="font-display font-extrabold text-ink"
        style={{ fontSize: 'clamp(29px, 5vw, 46px)', letterSpacing: '-0.03em', lineHeight: 1.08 }}
      >
        Who&apos;s ramping up?
      </h1>
      <p
        className="mt-4 hidden font-medium text-muted-1 md:block"
        style={{ fontSize: '15px', lineHeight: 1.65, maxWidth: '520px' }}
      >
        Open-role counts straight from companies&apos; own job boards, updated daily. No spin —
        just the count, and where it&apos;s headed.
      </p>
    </div>

    <StatCard market={market} />
  </Band>
);

/** The bordered market stat card: label, big total, counts, and the trend line. */
const StatCard: React.FC<{ market: MarketSummary }> = ({ market }) => (
  <div className="border border-line-3 bg-raised px-5 py-[18px] md:px-[26px] md:py-6">
    <MonoLabel>Market · open roles now</MonoLabel>
    <div
      className="mt-1 font-display font-extrabold tabular-nums text-ink md:mt-1.5"
      style={{ fontSize: 'clamp(40px, 10vw, 52px)', letterSpacing: '-0.03em', lineHeight: 1 }}
    >
      {formatCount(market.totalOpen)}
    </div>
    <div
      className="mt-3.5 hidden gap-5 font-mono text-muted-1 md:flex"
      style={{ fontSize: '12px' }}
    >
      <span>
        <b className="font-semibold text-ink">{formatCount(market.companyCount)}</b> companies
      </span>
      <span>
        <b className="font-semibold text-ink">{formatCount(market.sectorCount)}</b> sectors
      </span>
    </div>
    <div className="mt-2 md:mt-3.5">
      <TrendNote gated={market.gated} delta7d={market.delta7d} />
    </div>
  </div>
);

/**
 * The market trend line beneath the total: a "trend building — N of 14 daily snapshots"
 * caption while globally gated, or the signed 7-day delta with a directional glyph and
 * color once the market unlocks. The gating count is read from the market rollup.
 */
const TrendNote: React.FC<{ gated: boolean; delta7d: number | null }> = ({ gated, delta7d }) => {
  const { market } = useMarket();
  const daysTracked = market?.index.daysTracked ?? 0;

  if (gated || delta7d === null) {
    return (
      <span className="font-mono text-muted-3" style={{ fontSize: '11px' }}>
        trend building — {gatingLabel(daysTracked)} daily snapshots
      </span>
    );
  }

  const direction = delta7d > 0 ? 'up' : delta7d < 0 ? 'down' : 'flat';
  const view = momentumView(direction);

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono ${view.className}`} style={{ fontSize: '11px' }}>
      <MomentumArrow direction={direction} size={14} />
      <span>{formatDelta(delta7d)} roles vs 7 days ago</span>
    </span>
  );
};
