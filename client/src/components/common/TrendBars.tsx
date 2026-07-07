import React, { useEffect, useMemo, useState } from 'react';
import { scaleBand, scaleLinear, scaleTime } from 'd3-scale';

import { useElementSize } from '../../hooks/useElementSize';

import { formatCount, formatDate } from '../../lib/format';

/** One daily point on a trend chart. */
interface TrendPoint {
  /** ISO snapshot date (`YYYY-MM-DD`). */
  date: string;
  /** Open-role count on that date. */
  value: number;
}

interface TrendBarsProps {
  /** The daily series, oldest first; every point is drawn as a full-brand bar. */
  points: TrendPoint[];
  /** Tailwind height utilities for the whole plot (mobile + desktop), e.g. `h-[160px] md:h-[200px]`. */
  heightClass: string;
  /** Accessible one-line summary of the series for screen readers. */
  ariaLabel: string;
}

/** Plot inset (px) reserving room for the value axis (left) and time axis (bottom). */
const MARGIN = { top: 8, right: 6, bottom: 20 };
/** Minimum painted bar height (px) so a zero/near-zero count still reads as a bar. */
const MIN_BAR = 2;
/** Share of each column left as the gap between bars (d3 `paddingInner`) — even at any density. */
const BAR_GAP_RATIO = 0.28;

/** Parse an ISO date as UTC noon so the calendar day never shifts across the viewer's timezone. */
const parseDate = (iso: string): Date => new Date(`${iso}T12:00:00Z`);

/** Wrap a color token as `rgb(var(--token))` for an SVG `fill`/`stroke`, per the styling convention. */
const token = (name: string): string => `rgb(var(${name}))`;

/**
 * A d3-scaled SVG bar chart shared by the company trajectory and market index. d3-scale owns the
 * geometry — `scaleBand` for evenly-gapped columns at any density, `scaleLinear` for a value axis
 * with gridlines, and `scaleTime` for adaptive time-ticks — while React renders the SVG. A
 * full-height hit area per column drives a hover tooltip and a guide line; every bar is full
 * brand, with the hovered column deepened to `--brand-dark`.
 * @param props - The daily points, plot height utilities, and an accessible summary
 * @returns The chart (svg + tooltip), sized to its container
 */
export const TrendBars: React.FC<TrendBarsProps> = ({ points, heightClass, ariaLabel }) => {
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  // Drop the hover selection when the series changes (e.g. a range switch) so a retained index
  // can't keep the tooltip/guide pinned to a now-different day.
  useEffect(() => {
    setActive(null);
  }, [points]);

  const marginLeft = width < 380 ? 26 : 34;
  const innerW = Math.max(0, width - marginLeft - MARGIN.right);
  const innerH = Math.max(0, height - MARGIN.top - MARGIN.bottom);
  const ready = innerW > 0 && innerH > 0 && points.length > 0;

  // Rebuild the d3 scales only when the data or dimensions change, not on every hover re-render.
  // scaleTime chooses and formats the temporal ticks; each is then snapped to its nearest bar's
  // center so labels align with the bands (and stay correct if a poll gap leaves a missing day).
  const { x, y, yTicks, xTicks } = useMemo(() => {
    const firstDate = points[0]?.date ?? '2020-01-01';
    const lastDate = points[points.length - 1]?.date ?? '2020-01-01';
    const xScale = scaleBand<number>()
      .domain(points.map((_, i) => i))
      .range([0, innerW])
      .paddingInner(BAR_GAP_RATIO);
    const max = Math.max(1, ...points.map((p) => p.value));
    const yScale = scaleLinear().domain([0, max]).range([innerH, 0]).nice();
    const timeScale = scaleTime().domain([parseDate(firstDate), parseDate(lastDate)]).range([0, innerW]);
    const formatTick = timeScale.tickFormat();
    const bandCenter = (i: number): number => (xScale(i) ?? 0) + xScale.bandwidth() / 2;
    const pointTimes = points.map((p) => parseDate(p.date).getTime());
    const ticks = timeScale.ticks(width < 380 ? 3 : width < 640 ? 5 : 8).map((tickDate) => {
      const t = tickDate.getTime();
      let nearest = 0;
      for (let i = 1; i < pointTimes.length; i += 1) {
        if (Math.abs(pointTimes[i] - t) < Math.abs(pointTimes[nearest] - t)) nearest = i;
      }
      return { key: t, label: formatTick(tickDate), x: bandCenter(nearest) };
    });
    return { x: xScale, y: yScale, yTicks: yScale.ticks(width < 380 ? 3 : 4), xTicks: ticks };
  }, [points, innerW, innerH, width]);

  const lastIndex = points.length - 1;
  // Guard a stale index: switching the range (90D → 14D) mid-hover can leave `active` past the end.
  const activeIndex = active !== null && active <= lastIndex ? active : null;
  const activePoint = activeIndex === null ? null : points[activeIndex];

  return (
    <div ref={ref} className={`relative w-full ${heightClass}`}>
      {ready && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block">
          <g transform={`translate(${marginLeft}, ${MARGIN.top})`}>
            {yTicks.map((tick) => (
              <g key={`y-${tick}`} transform={`translate(0, ${y(tick)})`}>
                <line x2={innerW} stroke={token('--line-4')} shapeRendering="crispEdges" />
                <text x={-8} dy="0.32em" textAnchor="end" className="font-mono text-[10px]" style={{ fill: token('--muted-3') }}>
                  {formatCount(tick)}
                </text>
              </g>
            ))}

            {points.map((point, i) => {
              const barH = Math.max(MIN_BAR, innerH - y(point.value));
              return (
                <rect
                  key={point.date}
                  x={x(i) ?? 0}
                  y={innerH - barH}
                  width={x.bandwidth()}
                  height={barH}
                  className="animate-bar-rise"
                  style={{ fill: token(i === activeIndex ? '--brand-dark' : '--brand'), transformBox: 'fill-box' }}
                />
              );
            })}

            {xTicks.map((tick) => (
              <text
                key={tick.key}
                x={tick.x}
                y={innerH + 14}
                textAnchor="middle"
                className="font-mono uppercase text-[10px] tracking-[0.04em]"
                style={{ fill: token('--muted-3') }}
              >
                {tick.label}
              </text>
            ))}

            {activeIndex !== null && (
              <line
                x1={(x(activeIndex) ?? 0) + x.bandwidth() / 2}
                x2={(x(activeIndex) ?? 0) + x.bandwidth() / 2}
                y2={innerH}
                stroke={token('--line-2')}
                shapeRendering="crispEdges"
              />
            )}

            {points.map((point, i) => (
              <rect
                key={`hit-${point.date}`}
                x={i * x.step()}
                width={x.step()}
                height={innerH}
                fill="transparent"
                onPointerEnter={() => setActive(i)}
                onPointerMove={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
              />
            ))}
          </g>
        </svg>
      )}
      {activePoint && activeIndex !== null && (
        <Tooltip left={marginLeft + (x(activeIndex) ?? 0) + x.bandwidth() / 2} width={width} point={activePoint} />
      )}
    </div>
  );
};

/** The hover readout: a small ink card above the active column, clamped within the chart width. */
const Tooltip: React.FC<{ left: number; width: number; point: TrendPoint }> = ({ left, width, point }) => (
  <div
    className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 whitespace-nowrap rounded-sm bg-ink-strong px-2 py-1 font-mono text-paper text-[10px]"
    style={{ left: Math.max(56, Math.min(width - 56, left)) }}
  >
    {formatDate(point.date)} · {formatCount(point.value)} open
  </div>
);
