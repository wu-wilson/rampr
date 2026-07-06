import type { MomentumDirection } from '../types/common';

/** The presentation of a momentum direction: a word and a semantic color class (the arrow is `MomentumArrow`). */
export interface MomentumView {
  /** Human-readable label paired with the arrow so color is never load-bearing. */
  label: string;
  /** Tailwind text-color token: `text-up` | `text-down` | `text-flat`. */
  className: string;
}

const VIEWS: Record<MomentumDirection, MomentumView> = {
  up: { label: 'Ramping up', className: 'text-up' },
  down: { label: 'Cooling down', className: 'text-down' },
  flat: { label: 'Flat', className: 'text-flat' },
};

/**
 * Map a momentum direction to its label and color token. rampr never signals status by color
 * alone — the arrow glyph ({@link MomentumArrow}) and the word carry the meaning, color reinforces.
 * @param direction - The momentum direction from the API
 * @returns The label and Tailwind color-token class for the direction
 */
export function momentumView(direction: MomentumDirection): MomentumView {
  return VIEWS[direction];
}
