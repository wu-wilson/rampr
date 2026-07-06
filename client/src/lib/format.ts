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
 * Format an ISO date (`YYYY-MM-DD`) as a compact month + day label without the year, for
 * chart axes. Parsed as UTC noon so the calendar day never shifts across the viewer's timezone.
 * @param iso - An ISO date string
 * @returns A short label (e.g. `Jun 28`)
 */
export function formatDayMonth(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format the daily poll — scheduled at 06:00 UTC — as a label in the viewer's local timezone,
 * so a day-zero visitor sees when the first counts will land on their own clock.
 * @returns A label like `Poll scheduled · 11:00 PM PDT`
 */
export function formatPollSchedule(): string {
  const scheduled = new Date();
  scheduled.setUTCHours(6, 0, 0, 0);
  const time = scheduled.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  return `Poll scheduled · ${time}`;
}
