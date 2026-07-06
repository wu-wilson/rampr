import React from 'react';

import type { MomentumDirection } from '../../types/common';

/** Rotation (deg) that turns the base right-arrow into each direction's glyph: ↗ up, → flat, ↘ down. */
const ROTATION: Record<MomentumDirection, number> = {
  up: -45,
  flat: 0,
  down: 45,
};

interface MomentumArrowProps {
  /** Direction the arrow points: up (↗), flat (→), or down (↘). */
  direction: MomentumDirection;
  /** Rendered width/height in pixels. */
  size: number;
}

/**
 * The momentum direction glyph as a hand-rolled inline SVG — a right-pointing arrow rotated per
 * direction, drawn with `currentColor` so it inherits the surrounding momentum color. Centered in
 * its box (unlike the unicode arrows, whose font metrics sit off the optical center), so flex
 * `items-center` aligns it cleanly with the delta digits at any size.
 * @param props - The momentum direction and the pixel size
 * @returns The arrow svg (decorative — the paired label carries the meaning)
 */
export const MomentumArrow: React.FC<MomentumArrowProps> = ({ direction, size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="shrink-0"
  >
    <g transform={`rotate(${ROTATION[direction]} 10 10)`}>
      <path d="M3 10 H17" />
      <path d="M12 5 L17 10 L12 15" />
    </g>
  </svg>
);
