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
 * The Board hero: a full-width editorial headline and lede, then a row of post-it-style stat
 * notes — open roles now, companies, sectors, and the (gated) 7-day change — each a big Archivo
 * number over an uppercase mono label, tilted and taped to the board (2-up mobile / 4-up desktop).
 * @param props - The market summary driving the stat notes
 * @returns The headline band followed by the stat-notes band
 */
export const MarketHeadline: React.FC<MarketHeadlineProps> = ({ market }) => (
  <>
    <Band className="pb-[22px] pt-[26px] md:pb-9 md:pt-11">
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
    </Band>

    <Band className="py-7 md:py-9">
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
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
    </Band>
  </>
);

/** Slight per-note tilt so they read as taped up by hand, not printed on a grid. */
const NOTE_TILT = ['-2deg', '1.6deg', '-1.2deg', '2.1deg'];

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
        transform: 'translateX(-50%) rotate(-4deg)',
        // Torn ends: fine zigzag on the short (left/right) edges (shallow teeth), roll edges straight.
        clipPath:
          'polygon(0% 0%, 100% 0%, 95% 12.5%, 100% 25%, 95% 37.5%, 100% 50%, 95% 62.5%, 100% 75%, 95% 87.5%, 100% 100%, 0% 100%, 5% 87.5%, 0% 75%, 5% 62.5%, 0% 50%, 5% 37.5%, 0% 25%, 5% 12.5%)',
      }}
      aria-hidden="true"
    />
    <div
      className="font-display font-extrabold tabular-nums text-ink"
      style={{ fontSize: 'clamp(24px, 5.5vw, 32px)', letterSpacing: '-0.02em', lineHeight: 1 }}
    >
      {children}
    </div>
    <div
      className="mt-1.5 font-mono uppercase text-muted-3"
      style={{ fontSize: '10px', letterSpacing: '0.1em' }}
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
