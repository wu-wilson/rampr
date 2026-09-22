import { GATING_DAYS } from '../constants/config';

/**
 * Format the gating progress as an "N of `GATING_DAYS`" fraction for the trend-building panel.
 * @param daysTracked - Daily releases accrued so far
 * @returns A progress label (e.g. `6 of 14`)
 */
export function gatingLabel(daysTracked: number): string {
  return `${clampDays(daysTracked)} of ${GATING_DAYS}`;
}

/**
 * Build the fill state of the `GATING_DAYS`-cell progress row: one boolean per gating day, true up to
 * the number tracked so far.
 * @param daysTracked - Daily releases accrued so far
 * @returns An array of length GATING_DAYS where filled cells are `true`
 */
export function gatingCells(daysTracked: number): boolean[] {
  const filled = clampDays(daysTracked);
  return Array.from({ length: GATING_DAYS }, (_, index) => index < filled);
}

/** Clamp a raw tracked-days count into the 0..GATING_DAYS display range. */
function clampDays(daysTracked: number): number {
  return Math.max(0, Math.min(GATING_DAYS, daysTracked));
}
