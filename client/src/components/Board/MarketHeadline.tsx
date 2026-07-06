import React from 'react';

import { Band } from '../common/Band';
import { MomentumArrow } from '../common/MomentumArrow';

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

/** Slight per-note tilt so they read as taped up by hand, not printed on a grid. */
const NOTE_TILT = ['-2deg', '1.6deg', '-1.2deg', '2.1deg'];
/** Per-note tape angle, varied so each strip looks torn and stuck on individually. */
const TAPE_TILT = ['-6deg', '5deg', '7deg', '-3.5deg'];

/**
 * One stat "post-it": a warm paper note lifted off the board with a soft shadow, a slight hand
 * tilt, and a translucent strip of tape across the top — carrying a big Archivo value over an
 * uppercase mono label.
 * @param props - The value node, its label, and the zero-based index picking the tilt
 * @returns The stat note
 */
const StatNote: React.FC<{ children: React.ReactNode; label: string; index: number }> = ({
  children,
  label,
  index,
}) => (
  <div
    className="relative bg-raised px-4 py-5 shadow-[0_5px_16px_rgb(var(--ink)/0.11)]"
    style={{ transform: `rotate(${NOTE_TILT[index % NOTE_TILT.length]})` }}
  >
    <span
      className="pointer-events-none absolute h-[18px] w-14 bg-line-4/60"
      style={{
        left: '50%',
        top: '-8px',
        transform: `translateX(-50%) rotate(${TAPE_TILT[index % TAPE_TILT.length]})`,
        // Torn ends: fine zigzag on the short (left/right) edges (shallow teeth), roll edges straight.
        clipPath:
          'polygon(0% 0%, 100% 0%, 95% 12.5%, 100% 25%, 95% 37.5%, 100% 50%, 95% 62.5%, 100% 75%, 95% 87.5%, 100% 100%, 0% 100%, 5% 87.5%, 0% 75%, 5% 62.5%, 0% 50%, 5% 37.5%, 0% 25%, 5% 12.5%)',
      }}
      aria-hidden="true"
    />
    <div
      className="font-display font-extrabold tabular-nums text-ink tracking-[-0.02em] leading-none"
      style={{ fontSize: 'clamp(24px, 5.5vw, 32px)' }}
    >
      {children}
    </div>
    <div
      className="mt-1.5 font-mono uppercase text-muted-3 text-[10px] tracking-[0.1em]"
    >
      {label}
    </div>
  </div>
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
