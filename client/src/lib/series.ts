import { parseIsoDate } from './format';

/** One dated value on a daily series. */
export interface SeriesPoint {
  /** ISO snapshot date (`YYYY-MM-DD`). */
  date: string;
  value: number;
}

/** The highest and lowest points of a series, each with the day it was recorded. */
export interface SeriesExtremes {
  high: SeriesPoint;
  low: SeriesPoint;
}

/**
 * Whether an ISO date falls on a Saturday or Sunday, for the chart weekend bands.
 * @param iso - An ISO date string
 * @returns True on weekends
 */
export function isWeekend(iso: string): boolean {
  const day = parseIsoDate(iso).getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Find the high and low of a series. Ties resolve to the most recent day, so "today" wins
 * when it matches an earlier high.
 * @param points - The series, oldest first; must not be empty
 * @returns The high and low points
 */
export function seriesExtremes(points: SeriesPoint[]): SeriesExtremes {
  let high = points[0];
  let low = points[0];
  for (const point of points) {
    if (point.value >= high.value) high = point;
    if (point.value <= low.value) low = point;
  }
  return { high, low };
}

/**
 * The verb for a non-zero signed change, past tense, for the lead sentences.
 * @param delta - The signed change, never zero
 * @returns `rose` or `fell`
 */
export function changeVerb(delta: number): string {
  return delta > 0 ? 'rose' : 'fell';
}
