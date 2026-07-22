/** Real minus sign (U+2212), preferred over a hyphen for signed numbers. */
const MINUS = '−';

/**
 * Format an integer with thousands separators.
 * @param value - The number to format
 * @returns The value with comma group separators (e.g. `84,317`)
 */
export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

/** Shared compact number formatter (thousands → `K`, millions → `M`, one fraction digit). */
const COMPACT_FORMAT = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Format a count as a compact axis label — `3000 → "3K"`, `1500 → "1.5K"`, `100000 → "100K"`;
 * values below 1,000 render in full. For chart axis ticks where space is tight; the exact value
 * stays available in the hover tooltip.
 * @param value - The count to abbreviate
 * @returns The compact label
 */
export function formatCompact(value: number): string {
  return COMPACT_FORMAT.format(value);
}

/**
 * Format an already-whole-number percent for display.
 * @param pct - An integer percentage in the range 0..100
 * @returns The value with a percent sign (e.g. `41%`)
 */
export function formatPercent(pct: number): string {
  return `${Math.round(pct)}%`;
}

/**
 * Format a signed integer delta with an explicit sign and a real minus glyph.
 * @param delta - The signed change to format
 * @returns A signed string with a real minus glyph (e.g. `+18`, `−7`, `0`)
 */
export function formatDelta(delta: number): string {
  if (delta > 0) return `+${formatCount(delta)}`;
  if (delta < 0) return `${MINUS}${formatCount(Math.abs(delta))}`;
  return '0';
}

/**
 * Format an ISO date (`YYYY-MM-DD`) as a compact human label. Parsed as UTC noon so the
 * calendar day never shifts across the viewer's timezone.
 * @param iso - An ISO date string
 * @returns A short label (e.g. `Jun 28, 2026`)
 */
export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * The daily poll time — scheduled at 08:00 UTC — rendered in the viewer's local timezone.
 * @returns A local time label like `1:00 AM PDT`
 */
export function formatPollTimeLocal(): string {
  const scheduled = new Date();
  scheduled.setUTCHours(8, 0, 0, 0);
  return scheduled.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/**
 * Format the daily poll as a day-zero label in the viewer's local timezone, so a first-time
 * visitor sees when the first counts will land on their own clock.
 * @returns A label like `Poll scheduled · 1:00 AM PDT`
 */
export function formatPollSchedule(): string {
  return `Poll scheduled · ${formatPollTimeLocal()}`;
}

/**
 * Render the moment a snapshot was written — its date at the 08:00 UTC poll — fully in the
 * viewer's local timezone, so the date and time never straddle a day boundary.
 * @param snapshotDate - The ISO snapshot date (`YYYY-MM-DD`) the poll wrote
 * @returns A local label like `Jul 5 · 1:00 AM PDT`
 */
export function formatUpdatedAtLocal(snapshotDate: string): string {
  const moment = new Date(`${snapshotDate}T08:00:00Z`);
  const date = moment.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = moment.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  return `${date} · ${time}`;
}
