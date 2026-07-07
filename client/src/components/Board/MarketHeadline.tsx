import React from 'react';

import { Band } from '../common/Band';
import { MomentumArrow } from '../common/MomentumArrow';
import { PostItNote } from '../common/PostItNote';

import { formatCount, formatDelta } from '../../lib/format';
import { momentumView } from '../../lib/momentum';

import type { MarketSummary } from '../../types/board';

interface MarketHeadlineProps {
  /** Market-wide totals and 7-day trend gating for the hero + stat band. */
  market: MarketSummary;
}

/**
 * The Board hero: an editorial headline and lede on the left, with the market stat post-its — open
 * roles now, companies, sectors, and the (gated) 7-day change — clustered 2×2 on the right, each a
 * big Archivo number over an uppercase mono label, tilted and taped to the board. Stacks on mobile.
 * @param props - The market summary driving the stat notes
 * @returns The hero band
 */
export const MarketHeadline: React.FC<MarketHeadlineProps> = ({ market }) => (
  <Band className="py-9 md:py-12">
    <div className="grid gap-9 min-[1024px]:grid-cols-[1fr_460px] min-[1024px]:items-center min-[1024px]:gap-14">
      <div>
        <h1
          className="font-display font-extrabold text-ink tracking-[-0.03em] leading-[1.06]"
          style={{ fontSize: 'clamp(29px, 4.5vw, 46px)' }}
        >
          Who&apos;s ramping up?
        </h1>
        <p
          className="mt-4 font-medium text-muted-1 text-[16px] leading-[1.65]"
          style={{ maxWidth: '520px' }}
        >
          Open-role counts pulled straight from each company&apos;s own job board — Greenhouse,
          Lever, Ashby — once a day. No aggregators, no spin — just the count, and where it&apos;s
          headed.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 md:gap-8">
        <StatNote index={0} label="open roles now">
          {formatCount(market.totalOpen)}
        </StatNote>
        <StatNote index={1} label="companies">
          {formatCount(market.companyCount)}
        </StatNote>
        <StatNote index={2} label="sectors">
          {formatCount(market.sectorCount)}
        </StatNote>
        <StatNote index={3} label="vs 7 days ago">
          <TrendValue gated={market.gated} delta7d={market.delta7d} />
        </StatNote>
      </div>
    </div>
  </Band>
);

/**
 * One market stat on a post-it: a big Archivo value over an uppercase mono label, carried on the
 * shared taped note.
 * @param props - The value node, its label, and the zero-based index picking the note's tilt
 * @returns The stat note
 */
const StatNote: React.FC<{ children: React.ReactNode; label: string; index: number }> = ({
  children,
  label,
  index,
}) => (
  <PostItNote index={index} className="px-4 py-5">
    <div
      className="font-display font-extrabold tabular-nums text-ink tracking-[-0.02em] leading-none"
      style={{ fontSize: 'clamp(24px, 5.5vw, 32px)' }}
    >
      {children}
    </div>
    <div className="mt-1.5 font-mono uppercase text-muted-3 text-[10px] tracking-[0.1em]">
      {label}
    </div>
  </PostItNote>
);

/**
 * The 7-day-change value: a muted em dash while globally gated, otherwise the signed delta paired
 * with its directional arrow and semantic color (never color alone).
 * @param props - Global gating flag and the signed 7-day delta (`null` when gated)
 * @returns The trend value node
 */
const TrendValue: React.FC<{ gated: boolean; delta7d: number | null }> = ({ gated, delta7d }) => {
  if (gated || delta7d === null) {
    return <span className="text-muted-3">—</span>;
  }

  const direction = delta7d > 0 ? 'up' : delta7d < 0 ? 'down' : 'flat';
  const view = momentumView(direction);

  return (
    <span className={`inline-flex items-center gap-2 ${view.className}`}>
      <MomentumArrow direction={direction} size={26} />
      {formatDelta(delta7d)}
    </span>
  );
};
