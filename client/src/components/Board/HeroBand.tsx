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
 * The hero: a full-bleed band ruled like a ledger, carrying the lead panel and the hero chart
 * panel with every panel edge on a rule. From `lg` the panels sit side by side; below that they stack.
 * @param props - The market summary, the market index, and whether the index failed to load
 * @returns The hero band
 */
export const HeroBand: React.FC<HeroBandProps> = ({ market, index, indexFailed }) => {
  const bandRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  useSnapToRules(bandRef, textRef, chartRef);

  // The band's 48px pads and the stacked 47px gap are RULE_SPACING and RULE_SPACING - 1, so every panel edge lands on a rule.
  return (
    <section ref={bandRef} className="relative -mt-px overflow-hidden bg-paper py-12">
      <RulingBackdrop />
      <Rail className="relative z-[1] grid gap-[47px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-8">
        <div ref={textRef} className="border border-line bg-paper px-6 pb-6 pt-7 lg:px-12 lg:pb-10 lg:pt-11">
          <LeadPanel market={market} />
        </div>
        <div ref={chartRef} className="grid content-start gap-2.5 border border-line bg-paper px-6 pb-[18px] pt-[22px]">
          <HeroChart index={index} failed={indexFailed} />
        </div>
      </Rail>
    </section>
  );
};
