import React, { useMemo, useRef, useState } from 'react';

import { Change } from './Change';

import { useElementSize } from '../../hooks/useElementSize';

import { Y_LABEL_GAP, breadthGeometry, token } from '../../lib/chart';
import { formatCount, formatDayDate, formatDelta } from '../../lib/format';

import type { BreadthPoint } from '../../types/market';

/** Plot insets (px). `left` is a floor that widens for the value labels, `right` is zero so the plot runs to the edge. */
const MARGINS = { top: 14, right: 0, bottom: 24, left: 40 };
/** Each column's bar starts this share of the column in and spans this share of it. */
const BAR_INSET = 0.22;
const BAR_SHARE = 0.56;

interface BreadthChartProps {
  /** Breadth per release (boards rising and falling), oldest first; must not be empty. */
  points: BreadthPoint[];
  /** Chart height in pixels at every width; the width follows the container. */
  height: number;
  /** Accessible one-line summary of the series. */
  ariaLabel: string;
}

/**
 * The breadth chart: one bar per release for boards rising minus falling, with a pointer-following readout.
 * @param props - The breadth series, plot height, and an accessible summary
 * @returns The chart, sized to its container
 */
export const BreadthChart: React.FC<BreadthChartProps> = ({ points, height, ariaLabel }) => {
  const [ref, { width }] = useElementSize<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  // The hovered index stays with the series it was read from, so a new series renders unhovered.
  const [hover, setHover] = useState<{ points: BreadthPoint[]; index: number } | null>(null);
  const hovered = hover?.points === points ? hover.index : null;
  const active = hovered ?? points.length - 1;

  const net = useMemo(() => points.map((point) => ({ date: point.date, value: point.rising - point.falling })), [points]);
  const geometry = useMemo(() => {
    if (width <= 0 || net.length === 0) return null;
    return breadthGeometry(net, width, height, MARGINS);
  }, [net, width, height]);

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>): void => {
    if (!geometry || !svgRef.current) return;
    const px = event.clientX - svgRef.current.getBoundingClientRect().left;
    const index = Math.floor((px - geometry.plotLeft) / geometry.band);
    setHover(Number.isFinite(index) && index >= 0 && index < points.length ? { points, index } : null);
  };
  const handlePointerLeave = (): void => setHover(null);

  const activePoint = points[active];

  return (
    <div ref={ref} className="relative w-full [contain:inline-size]" style={{ height }}>
      {geometry && (
        <svg
          ref={svgRef}
          width={width}
          height={height}
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
              <line x1={geometry.plotLeft} x2={geometry.plotRight} y1={geometry.y(tick)} y2={geometry.y(tick)} stroke={token(tick === 0 ? '--line-3' : '--line')} shapeRendering="crispEdges" />
              <text x={geometry.plotLeft - Y_LABEL_GAP} y={geometry.y(tick) + 4} textAnchor="end" className="text-[11.5px]" style={{ fill: token('--ink-3') }}>
                {formatDelta(tick)}
              </text>
            </g>
          ))}
          {net.map((point, index) => {
            const colour = point.value > 0 ? '--up' : point.value < 0 ? '--down' : '--line-3';
            const top = Math.min(geometry.y(0), geometry.y(point.value));
            const barHeight = Math.max(1, Math.abs(geometry.y(point.value) - geometry.y(0)));
            return <rect key={point.date} x={geometry.x(index) + geometry.band * BAR_INSET} y={top} width={geometry.band * BAR_SHARE} height={barHeight} fill={token(colour)} />;
          })}
          {geometry.xTicks.map((tick) => (
            <text key={tick.index} x={geometry.x(tick.index) + geometry.band / 2} y={height - 6} textAnchor={tick.anchor} className="text-[11.5px]" style={{ fill: token('--ink-3') }}>
              {tick.label}
            </text>
          ))}
          {hovered !== null && (
            <line x1={geometry.x(active) + geometry.band / 2} x2={geometry.x(active) + geometry.band / 2} y1={geometry.plotTop} y2={geometry.plotBottom} stroke={token('--ink')} strokeOpacity={0.35} />
          )}
        </svg>
      )}
      {geometry && (
        <div className="pointer-events-none absolute -top-1.5 flex gap-3 whitespace-nowrap text-[12.5px] text-ink-2" style={{ left: geometry.plotLeft }}>
          <span>{formatDayDate(activePoint.date)}</span>
          <Change delta={activePoint.rising - activePoint.falling} />
          <span>
            {formatCount(activePoint.rising)} rose, {formatCount(activePoint.falling)} fell
          </span>
        </div>
      )}
    </div>
  );
};
