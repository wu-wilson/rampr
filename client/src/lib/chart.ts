import { scaleLinear } from 'd3-scale';

import { formatCount, formatDelta, formatShortDate } from './format';
import { isWeekend } from './series';

import type { SeriesPoint } from './series';

/** Plot insets in pixels. */
interface ChartMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** One time-axis label, positioned by series index. */
interface AxisTick {
  index: number;
  label: string;
  /** Edge ticks anchor inward so the label never leaves the plot. */
  anchor: 'start' | 'middle' | 'end';
}

/** One shaded weekend column, in pixels. */
interface WeekendBand {
  x: number;
  width: number;
}

/** Everything a line chart needs to draw one series: scales, the path, ticks, and bands. */
interface LineGeometry {
  x: (index: number) => number;
  y: (value: number) => number;
  path: string;
  yTicks: number[];
  xTicks: AxisTick[];
  weekends: WeekendBand[];
  plotTop: number;
  plotBottom: number;
  plotLeft: number;
  plotRight: number;
}

/** Everything a breadth chart needs: a column per release, a symmetric value axis, ticks, and bands. */
interface BreadthGeometry {
  x: (index: number) => number;
  y: (value: number) => number;
  /** Width of one release's column. */
  band: number;
  yTicks: number[];
  xTicks: AxisTick[];
  weekends: WeekendBand[];
  plotTop: number;
  plotBottom: number;
  plotLeft: number;
  plotRight: number;
}

/**
 * Wrap a colour token as `rgb(var(--token))` for an SVG `fill` or `stroke`, per the styling convention.
 * @param name - The custom property name, e.g. `--ink`
 * @returns The colour expression
 */
export function token(name: string): string {
  return `rgb(var(${name}))`;
}

/** Below this chart width (px) a line chart runs shorter, so a phone plot is never taller than it is wide. */
const NARROW_CHART_WIDTH = 480;
/** Height multiplier for narrow line charts. */
const NARROW_HEIGHT_SCALE = 0.72;

/**
 * The line chart height to draw at a given width: the full height on desktop, a shorter one on phones.
 * @param width - Measured chart width in pixels (0 before the first measure)
 * @param height - The height the chart asks for on desktop
 * @returns The height to draw
 */
export function chartHeight(width: number, height: number): number {
  return width > 0 && width < NARROW_CHART_WIDTH ? Math.round(height * NARROW_HEIGHT_SCALE) : height;
}

/** Axis label size (px), matching the `text-[11.5px]` the charts render ticks at. */
const AXIS_LABEL_PX = 11.5;
/** Switzer's average advance per glyph in a tabular figure string at label sizes, as a fraction of the font size. */
const CHAR_ADVANCE_EM = 0.55;
/** Gap (px) between a value label's right edge and the plot. */
export const Y_LABEL_GAP = 10;
/** Share of the value range added above and below the series so the line never touches the frame. */
const Y_PAD_RATIO = 0.2;
/** Grid lines the value axis aims for. */
const Y_TICK_COUNT = 4;

/** Estimated pixel width of a label at a font size, over-estimated slightly so nothing clips. */
function labelWidth(label: string, sizePx: number): number {
  return Math.ceil(label.length * sizePx * CHAR_ADVANCE_EM) + 2;
}

/** How many time-axis labels (3 to 5) fit a plot of the given inner width. */
function tickCountFor(width: number): number {
  if (width < 380) return 3;
  if (width < 640) return 4;
  return 5;
}

/** Evenly spaced time-axis ticks by index, first and last included, with edge anchors turned inward. */
function timeTicks(dates: string[], width: number): AxisTick[] {
  const last = dates.length - 1;
  if (last < 0) return [];
  const count = Math.min(tickCountFor(width), dates.length);
  const ticks: AxisTick[] = [];
  for (let k = 0; k < count; k += 1) {
    const index = count === 1 ? 0 : Math.round((k * last) / (count - 1));
    const anchor = index === 0 ? 'start' : index === last ? 'end' : 'middle';
    ticks.push({ index, label: formatShortDate(dates[index]), anchor });
  }
  return ticks;
}

/** Shaded columns for the weekend releases, half a step either side of each point, clipped to the plot. */
function weekendBands(
  dates: string[],
  x: (index: number) => number,
  half: number,
  left: number,
  right: number,
): WeekendBand[] {
  const bands: WeekendBand[] = [];
  dates.forEach((date, index) => {
    if (!isWeekend(date)) return;
    const x0 = Math.max(left, x(index) - half);
    const x1 = Math.min(right, x(index) + half);
    if (x1 > x0) bands.push({ x: x0, width: x1 - x0 });
  });
  return bands;
}

/**
 * Lay out a daily line chart: an index-based x scale, a value axis fitted to the series (floored
 * at zero) with nice gridlines, the series path, evenly spaced date ticks, and the weekend bands.
 * The left inset grows to fit the widest value label.
 * @param points - The series, oldest first; must not be empty
 * @param width - Chart width in pixels
 * @param height - Chart height in pixels
 * @param margins - Plot insets; `left` is a floor, widened for the value labels
 * @param minPad - The least vertical padding, in series units, above and below the line
 * @returns The line geometry
 */
export function lineGeometry(
  points: SeriesPoint[],
  width: number,
  height: number,
  margins: ChartMargins,
  minPad: number,
): LineGeometry {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * Y_PAD_RATIO, minPad);
  const yScale = scaleLinear().domain([Math.max(0, min - pad), max + pad]).nice(Y_TICK_COUNT);
  const yTicks = yScale.ticks(Y_TICK_COUNT);
  const widest = Math.max(0, ...yTicks.map((tick) => labelWidth(formatCount(tick), AXIS_LABEL_PX)));
  const plotLeft = Math.max(margins.left, Y_LABEL_GAP + widest);
  const plotRight = width - margins.right;
  const plotTop = margins.top;
  const plotBottom = height - margins.bottom;
  yScale.range([plotBottom, plotTop]);

  const last = points.length - 1;
  const innerW = Math.max(0, plotRight - plotLeft);
  const x = (index: number): number => (last === 0 ? plotLeft + innerW / 2 : plotLeft + (index / last) * innerW);
  const y = (value: number): number => yScale(value);
  const half = last === 0 ? innerW / 2 : innerW / last / 2;
  const dates = points.map((point) => point.date);
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)} ${y(point.value).toFixed(1)}`).join(' ');

  return {
    x,
    y,
    path,
    yTicks,
    xTicks: timeTicks(dates, innerW),
    weekends: weekendBands(dates, x, half, plotLeft, plotRight),
    plotTop,
    plotBottom,
    plotLeft,
    plotRight,
  };
}

/**
 * Lay out the breadth chart: one column per release and a value axis symmetric about zero,
 * rounded up to the nearest ten, with the weekend bands.
 * @param points - Net breadth per release (rising minus falling), oldest first; must not be empty
 * @param width - Chart width in pixels
 * @param height - Chart height in pixels
 * @param margins - Plot insets; `left` is a floor, widened for the value labels
 * @returns The breadth geometry
 */
export function breadthGeometry(
  points: SeriesPoint[],
  width: number,
  height: number,
  margins: ChartMargins,
): BreadthGeometry {
  const extent = Math.max(10, Math.ceil(Math.max(...points.map((point) => Math.abs(point.value))) / 10) * 10);
  const yTicks = [-extent, 0, extent];
  const widest = labelWidth(formatDelta(extent), AXIS_LABEL_PX);
  const plotLeft = Math.max(margins.left, Y_LABEL_GAP + widest);
  const plotRight = width - margins.right;
  const plotTop = margins.top;
  const plotBottom = height - margins.bottom;
  const innerW = Math.max(0, plotRight - plotLeft);
  const band = innerW / points.length;
  const x = (index: number): number => plotLeft + index * band;
  const yScale = scaleLinear().domain([-extent, extent]).range([plotBottom, plotTop]);
  const y = (value: number): number => yScale(value);
  const dates = points.map((point) => point.date);
  const centred = (index: number): number => x(index) + band / 2;

  return {
    x,
    y,
    band,
    yTicks,
    xTicks: timeTicks(dates, innerW),
    weekends: weekendBands(dates, centred, band / 2, plotLeft, plotRight),
    plotTop,
    plotBottom,
    plotLeft,
    plotRight,
  };
}
