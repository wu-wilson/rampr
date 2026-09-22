import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Change } from './Change';
import { useRevealPhase } from './Reveal';

import { useDrawReveal } from '../../hooks/useDrawReveal';
import { useElementSize } from '../../hooks/useElementSize';

import { Y_LABEL_GAP, chartHeight, lineGeometry, token } from '../../lib/chart';
import { formatCount, formatDayDate } from '../../lib/format';

import type { SeriesPoint } from '../../lib/series';

interface LineChartProps {
  /** The daily series, oldest first; must not be empty. */
  points: SeriesPoint[];
  /** Chart height in pixels on desktop, shortened on narrow widths; the width follows the container. */
  height: number;
  /** The least vertical padding, in series units, above and below the line. */
  minPad: number;
  /** Accessible one-line summary of the series. */
  ariaLabel: string;
}

/** Plot insets (px). `left` is a floor that widens for the value labels, `right` is zero so the plot runs to the edge. */
const MARGINS = { top: 14, right: 0, bottom: 24, left: 40 };

/**
 * A daily line chart: weekend bands, a value axis fitted to the series, the line, and an endpoint
 * dot. A readout above the plot names the day, the count, and the change from the day before,
 * following the pointer and resting on the latest release.
 * @param props - The series, desktop plot height, vertical padding, and an accessible summary
 * @returns The chart, sized to its container
 */
export const LineChart: React.FC<LineChartProps> = ({ points, height, minPad, ariaLabel }) => {
  const [ref, { width }] = useElementSize<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  useDrawReveal(pathRef, useRevealPhase());

  // Drop the hover selection when the series changes so a retained index can't pin a stale day.
  useEffect(() => {
    setHovered(null);
  }, [points]);

  const last = points.length - 1;
  const active = hovered ?? last;
  const plotHeight = chartHeight(width, height);
  const geometry = useMemo(() => {
    if (width <= 0 || points.length === 0) return null;
    return lineGeometry(points, width, plotHeight, MARGINS, minPad);
  }, [points, width, plotHeight, minPad]);

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>): void => {
    if (!geometry || !svgRef.current) return;
    const px = event.clientX - svgRef.current.getBoundingClientRect().left;
    const span = geometry.plotRight - geometry.plotLeft;
    const index = Math.round(((px - geometry.plotLeft) / span) * last);
    setHovered(Number.isFinite(index) && index >= 0 && index <= last ? index : null);
  };
  const handlePointerLeave = (): void => setHovered(null);

  const activePoint = points[active];

  // Inline-size containment keeps the svg's explicit pixel width from becoming the container's
  // minimum, so the chart can always shrink with the viewport.
  return (
    <div ref={ref} className="relative w-full [contain:inline-size]" style={{ height: plotHeight }}>
      {geometry && (
        <svg
          ref={svgRef}
          width={width}
          height={plotHeight}
          role="img"
          aria-label={ariaLabel}
          className="block overflow-visible"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {geometry.weekends.map((band) => (
            <rect key={band.x} x={band.x} y={geometry.plotTop} width={band.width} height={geometry.plotBottom - geometry.plotTop} fill={token('--weekend')} />
          ))}
          {geometry.yTicks.map((tick) => (
            <g key={tick}>
              <line x1={geometry.plotLeft} x2={geometry.plotRight} y1={geometry.y(tick)} y2={geometry.y(tick)} stroke={token('--line')} shapeRendering="crispEdges" />
              <text x={geometry.plotLeft - Y_LABEL_GAP} y={geometry.y(tick) + 4} textAnchor="end" className="text-[11.5px]" style={{ fill: token('--ink-3') }}>
                {formatCount(tick)}
              </text>
            </g>
          ))}
          <path ref={pathRef} d={geometry.path} fill="none" stroke={token('--ink')} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
          {geometry.xTicks.map((tick) => (
            <text key={tick.index} x={geometry.x(tick.index)} y={plotHeight - 6} textAnchor={tick.anchor} className="text-[11.5px]" style={{ fill: token('--ink-3') }}>
              {tick.label}
            </text>
          ))}
          <circle cx={geometry.x(last)} cy={geometry.y(points[last].value)} r={4} fill={token('--ink')} />
          {hovered !== null && (
            <g>
              <line x1={geometry.x(active)} x2={geometry.x(active)} y1={geometry.plotTop} y2={geometry.plotBottom} stroke={token('--ink')} strokeOpacity={0.35} />
              <circle cx={geometry.x(active)} cy={geometry.y(activePoint.value)} r={4} fill={token('--paper')} stroke={token('--ink')} strokeWidth={1.5} />
            </g>
          )}
        </svg>
      )}
      {geometry && (
        <div className="pointer-events-none absolute -top-1.5 flex gap-3 whitespace-nowrap text-[12.5px] text-ink-2" style={{ left: geometry.plotLeft }}>
          <span>{formatDayDate(activePoint.date)}</span>
          <b className="font-medium text-ink">{formatCount(activePoint.value)}</b>
          {active > 0 && <Change delta={activePoint.value - points[active - 1].value} />}
        </div>
      )}
    </div>
  );
};
