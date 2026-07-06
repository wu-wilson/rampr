import React from 'react';

import { gatingDots, gatingLabel } from '../../lib/gating';

interface GatedTrendProps {
  /** Daily snapshots accrued so far for this surface. */
  daysTracked: number;
  /** Leading word of the panel title — "Trend" for a trajectory, "Index" for the market index. */
  label?: string;
  /** Desktop-only reassurance line beneath the title (e.g. "today's count is already live …"). */
  caption?: string;
}

/**
 * The dashed "trend building" panel shown wherever a trend surface is still gated: a
 * centered 14-dot progress row over a "{label} building — N of 14" line, with an optional
 * desktop-only caption. The title shortens to "… of 14 days" on mobile.
 * @param props - Snapshots tracked so far, the title label, and an optional desktop caption
 * @returns The gated-trend panel
 */
export const GatedTrend: React.FC<GatedTrendProps> = ({ daysTracked, label = 'Trend', caption }) => (
  <div className="flex flex-col items-center gap-2.5 rounded-sm border border-dashed border-line-4 bg-raised px-4 py-[22px] text-center md:gap-3 md:py-[34px]">
    <div className="flex flex-wrap justify-center gap-1 md:gap-1.5" aria-hidden="true">
      {gatingDots(daysTracked).map((filled, index) => (
        <span
          key={index}
          className={`h-2.5 w-2.5 rounded-full border border-line-4 md:h-3.5 md:w-3.5 ${
            filled ? 'bg-brand' : 'bg-paper'
          }`}
        />
      ))}
    </div>

    <p className="font-mono font-semibold uppercase tracking-[0.06em] text-muted-1 text-[11px] md:text-[12px]">
      {label} building — {gatingLabel(daysTracked)}
      <span className="md:hidden"> days</span>
      <span className="hidden md:inline"> daily snapshots</span>
    </p>

    {caption && (
      <p className="hidden font-mono text-muted-3 md:block text-[11px]">
        {caption}
      </p>
    )}
  </div>
);
