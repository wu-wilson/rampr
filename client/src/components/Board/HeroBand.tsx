import React, { useRef } from 'react';

import { Rail } from '../common/Rail';
import { HeroChart } from './HeroChart';
import { LeadPanel } from './LeadPanel';
import { RulingBackdrop } from './RulingBackdrop';

import { useSnapToRules } from '../../hooks/useSnapToRules';

import type { MarketSummary } from '../../types/board';
import type { MarketIndex } from '../../types/market';

interface HeroBandProps {
  market: MarketSummary;
  /** The market index for the hero chart, or null while loading or after a failed load. */
  index: MarketIndex | null;
  /** True when the market index could not be read. */
  indexFailed: boolean;
}

/**
 * The hero: a full-bleed ruled band holding the lead and chart panels, side by side from `lg`.
 * @param props - The market summary, the market index, and whether the index failed to load
 * @returns The hero band
 */
export const HeroBand: React.FC<HeroBandProps> = ({ market, index, indexFailed }) => {
  const bandRef = useRef<HTMLElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  useSnapToRules(bandRef, leadRef, chartRef);

  // The 32px band pads and 31px stacked gap are RULE_SPACING and RULE_SPACING - 1. Vertical paddings are trimmed by the
  // first and last lines' half-leading, so the ink sits the same distance from every border.
  return (
    <section ref={bandRef} className="relative -mt-px flex flex-col justify-center overflow-hidden bg-paper py-8">
      <RulingBackdrop />
      <Rail className="relative z-[1] grid gap-[31px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8">
        <div ref={leadRef} className="flex flex-col justify-between border border-line bg-paper px-6 pb-4 pt-5 lg:px-10 lg:pb-[33px] lg:pt-9">
          <LeadPanel market={market} />
        </div>
        <div ref={chartRef} className="flex flex-col gap-2.5 border border-line bg-paper px-6 py-[19px]">
          <HeroChart index={index} failed={indexFailed} />
        </div>
      </Rail>
    </section>
  );
};
