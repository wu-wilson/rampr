import React from 'react';

import { MomentumArrow } from './MomentumArrow';

import { formatDelta } from '../../lib/format';
import { momentumView } from '../../lib/momentum';

import type { Momentum } from '../../types/common';

interface MomentumBadgeProps {
  momentum: Momentum;
  /** When true, append the "Ramping up" / "Cooling down" / "Flat" word after the delta. */
  showLabel?: boolean;
  /** Font size of the delta in pixels. */
  size?: number;
  /** Arrow size as a multiple of the delta font size (default 1.3); lower it where a smaller arrow reads better. */
  arrowScale?: number;
  /** When true, render the delta at display weight (800) for the company header tile. */
  strong?: boolean;
}

/**
 * The reusable momentum indicator: a directional glyph, the signed delta, and an optional
 * word, all sharing a semantic color. Never signals by color alone — the glyph and word
 * carry the meaning. While momentum is gated it renders a muted dot and a "building" label.
 * @param props - The momentum, whether to show the word label, the glyph size, and weight
 * @returns The momentum badge
 */
export const MomentumBadge: React.FC<MomentumBadgeProps> = ({ momentum, showLabel, size = 14, arrowScale = 1.3, strong }) => {
  if (momentum.gated || momentum.delta === null) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-3" style={{ fontSize: `${size}px` }}>
        <span aria-hidden="true">·</span>
        <span className="font-mono" style={{ fontSize: '11px' }}>
          building
        </span>
      </span>
    );
  }

  const view = momentumView(momentum.direction);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono ${view.className}`}
      title={view.label}
      style={{ fontSize: `${size}px` }}
    >
      <MomentumArrow direction={momentum.direction} size={Math.round(size * arrowScale)} />
      <span className={`tabular-nums ${strong ? 'font-extrabold' : 'font-semibold'}`}>
        {formatDelta(momentum.delta)}
      </span>
      {showLabel && (
        <span className="font-mono" style={{ fontSize: '11px' }}>
          {view.label}
        </span>
      )}
    </span>
  );
};
