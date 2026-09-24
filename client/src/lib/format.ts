import { RELEASE_HOUR_UTC } from '../constants/config';

/** Real minus sign (U+2212), preferred over a hyphen for signed numbers. */
const MINUS = '−';

/**
 * Parse an ISO date (`YYYY-MM-DD`) as the start of that day in UTC, the timezone every release is
 * dated in. Read it back with UTC getters or the formatters below, never the viewer's local time.
 * @param iso - An ISO date string
 * @returns The date at 00:00 UTC
 */
export function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Format an ISO date in UTC, so a viewer far from UTC never sees a release land on the wrong day. */
function formatIsoDate(iso: string, options: Intl.DateTimeFormatOptions): string {
  return parseIsoDate(iso).toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });
}

/**
 * Format an integer with thousands separators.
 * @param value - A whole count of postings, boards, or releases
 * @returns The value with comma group separators (e.g. `84,317`)
 */
export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

/**
 * Format a whole-number percent for display.
 * @param pct - An integer percentage in the range 0..100
 * @returns The value with a percent sign (e.g. `41%`)
 */
export function formatPercent(pct: number): string {
  return `${pct}%`;
}

/**
 * Format a share of a whole to one decimal place.
 * @param part - The numerator
 * @param whole - The denominator; a zero whole reads as `0.0%`
 * @returns A one-decimal percent (e.g. `27.7%`)
 */
export function formatShare(part: number, whole: number): string {
  return `${whole > 0 ? ((part / whole) * 100).toFixed(1) : '0.0'}%`;
}

/**
 * Format a signed integer change with an explicit sign and a real minus glyph.
 * @param delta - The signed change to format
 * @returns A signed string (e.g. `+18`, `−7`, `0`)
 */
export function formatDelta(delta: number): string {
  if (delta > 0) return `+${formatCount(delta)}`;
  if (delta < 0) return `${MINUS}${formatCount(Math.abs(delta))}`;
  return '0';
}

/**
 * Format a change as a signed percent of the value it started from. A base at or below zero has
 * no percentage and reads `0.0%`.
 * @param delta - The signed change
 * @param current - The value after the change; the base is `current − delta`
 * @returns A signed one-decimal percent (e.g. `+1.4%`, `−0.3%`, `0.0%`)
 */
export function formatSignedPercent(delta: number, current: number): string {
  const base = current - delta;
  if (base <= 0) return '0.0%';
  const pct = Math.abs((delta / base) * 100).toFixed(1);
  if (delta > 0) return `+${pct}%`;
  if (delta < 0) return `${MINUS}${pct}%`;
  return '0.0%';
}

/**
 * Format an ISO date as a compact label with the year.
 * @param iso - An ISO date string
 * @returns A short label (e.g. `Jun 28, 2026`)
 */
export function formatDate(iso: string): string {
  return formatIsoDate(iso, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format an ISO date as month and day only, for axis ticks and table rows.
 * @param iso - An ISO date string
 * @returns A short label (e.g. `Sep 21`)
 */
export function formatShortDate(iso: string): string {
  return formatIsoDate(iso, { month: 'short', day: 'numeric' });
}

/**
 * Format an ISO date with its weekday, for the daily table and the chart readout.
 * @param iso - An ISO date string
 * @returns A label like `Mon, Sep 21`
 */
export function formatDayDate(iso: string): string {
  return formatIsoDate(iso, { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Format an ISO date in full, for the release stamp.
 * @param iso - An ISO date string
 * @returns A label like `Monday, September 21, 2026`
 */
export function formatLongDate(iso: string): string {
  return formatIsoDate(iso, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Format an ISO date as it would be spoken in a sentence, month and day in full.
 * @param iso - An ISO date string
 * @returns A label like `September 21`
 */
export function formatSpokenDate(iso: string): string {
  return formatIsoDate(iso, { month: 'long', day: 'numeric' });
}

/**
 * Format an ISO date as it would be spoken with its year.
 * @param iso - An ISO date string
 * @returns A label like `July 5, 2026`
 */
export function formatSpokenDateYear(iso: string): string {
  return formatIsoDate(iso, { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Format a rank as an ordinal.
 * @param rank - A positive integer position
 * @returns The ordinal (e.g. `1st`, `2nd`, `4th`, `11th`)
 */
export function formatOrdinal(rank: number): string {
  const tens = rank % 100;
  if (tens >= 11 && tens <= 13) return `${rank}th`;
  const ones = rank % 10;
  const suffix = ones === 1 ? 'st' : ones === 2 ? 'nd' : ones === 3 ? 'rd' : 'th';
  return `${rank}${suffix}`;
}

/**
 * The daily release time as scheduled.
 * @returns A UTC clock label like `08:00 UTC`
 */
export function formatReleaseTimeUtc(): string {
  return `${String(RELEASE_HOUR_UTC).padStart(2, '0')}:00 UTC`;
}

/**
 * The daily release time rendered in the viewer's local timezone.
 * @returns A local time label like `1:00 AM PDT`
 */
export function formatReleaseTimeLocal(): string {
  const scheduled = new Date();
  scheduled.setUTCHours(RELEASE_HOUR_UTC, 0, 0, 0);
  return scheduled.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
}
