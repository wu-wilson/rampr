import React from 'react';

import { MomentumArrow } from './MomentumArrow';

import { formatDelta } from '../../lib/format';
import { momentumView } from '../../lib/momentum';

import type { Momentum } from '../../types/common';

interface MomentumBadgeProps {
  momentum: Momentum;
  /** Font size of the delta in pixels. */
  size?: number;
  /** Arrow size as a multiple of the delta font size (default 1.3); lower it where a smaller arrow reads better. */
  arrowScale?: number;
  /** When true, render the delta at display weight (800) for the company header tile. */
  strong?: boolean;
}

/**
 * The reusable momentum indicator: a directional glyph and the signed delta sharing a semantic
 * color. Never signals by color alone — the glyph and signed delta carry the meaning, with the
 * direction word ("Ramping up" / "Cooling down" / "Flat") riding along as the hover title. While
 * momentum is gated it renders a muted dot and a "building" label.
 * @param props - The momentum, the delta font size, the arrow-to-digit scale, and whether the delta is display weight
 * @returns The momentum badge
 */
export const MomentumBadge: React.FC<MomentumBadgeProps> = ({ momentum, size = 14, arrowScale = 1.3, strong }) => {
  if (momentum.gated || momentum.delta === null) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-3" style={{ fontSize: `${size}px` }}>
        <span aria-hidden="true">·</span>
        <span className="font-mono text-[11px]">
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
    </span>
  );
};
