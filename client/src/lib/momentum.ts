import type { MomentumDirection } from '../types/common';

/** The presentation of a momentum direction: a glyph, a word, and a semantic color class. */
export interface MomentumView {
  /** Directional arrow that carries the meaning on its own. */
  glyph: '↗' | '↘' | '→';
  /** Human-readable label paired with the glyph so color is never load-bearing. */
  label: string;
  /** Tailwind text-color token: `text-up` | `text-down` | `text-flat`. */
  className: string;
}

const VIEWS: Record<MomentumDirection, MomentumView> = {
  up: { glyph: '↗', label: 'Ramping up', className: 'text-up' },
  down: { glyph: '↘', label: 'Cooling down', className: 'text-down' },
  flat: { glyph: '→', label: 'Flat', className: 'text-flat' },
};

/**
 * Map a momentum direction to its glyph, label, and color token. rampr never signals
 * status by color alone — the glyph and word carry the meaning, color only reinforces.
 * @param direction - The momentum direction from the API
 * @returns The glyph, label, and Tailwind color-token class for the direction
 */
export function momentumView(direction: MomentumDirection): MomentumView {
  return VIEWS[direction];
}
