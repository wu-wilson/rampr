import React from 'react';

import { gatingCells, gatingLabel } from '../../lib/gating';

import { GATING_DAYS } from '../../constants/config';

interface GatedPanelProps {
  /** Daily releases accrued so far for this surface. */
  daysTracked: number;
  /** What unlocks, e.g. `The trend` or `Changes`. */
  label: string;
  /** A closing sentence, e.g. what is already live. */
  note: string;
  /** Draw the hairline box; pass false inside a panel that already has one. */
  framed?: boolean;
}

/**
 * The panel shown wherever a trend surface is still building: a row of `GATING_DAYS` cells filling one
 * per release, over a plain statement of what unlocks and when. Same hairline box as a chart
 * panel, so it holds the figure's place without pretending to be one.
 * @param props - Releases so far, the surface's name, a closing note, and whether to draw the box
 * @returns The gated panel
 */
export const GatedPanel: React.FC<GatedPanelProps> = ({ daysTracked, label, note, framed = true }) => (
  <div className={`px-6 py-8 text-center ${framed ? 'border border-line' : ''}`}>
    <div className="mx-auto flex max-w-[336px] gap-1" aria-hidden="true">
      {gatingCells(daysTracked).map((filled, index) => (
        <span key={index} className={`h-1.5 flex-1 ${filled ? 'bg-ink' : 'bg-line-2'}`} />
      ))}
    </div>
    <p className="mt-4 text-[14px] font-medium">{label} builds at {GATING_DAYS} releases.</p>
    <p className="mt-1 text-[13px] text-ink-2">
      {gatingLabel(daysTracked)} so far. {note}
    </p>
  </div>
);
