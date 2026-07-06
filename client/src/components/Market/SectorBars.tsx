import React from 'react';

import { MonoLabel } from '../common/MonoLabel';

import { formatCount } from '../../lib/format';

import type { SectorTotal } from '../../types/market';

interface SectorBarsProps {
  /** Sector totals, already ordered by open-role count (largest first). */
  sectors: SectorTotal[];
}

/**
 * Open roles by sector as labeled horizontal bars: a mono label, a bar whose width is the
 * sector's share of the leader, and the count. Bars step down a green ramp — darkest for
 * the largest sector through to a faint tail — so rank reads at a glance. Always live,
 * never gated.
 * @param props - The sector totals, already ordered by count
 * @returns The sector-bars column
 */
export const SectorBars: React.FC<SectorBarsProps> = ({ sectors }) => (
  <div>
    <MonoLabel>
      Open roles by sector<span className="hidden md:inline"> · now</span>
    </MonoLabel>
    <div className="mt-4 flex flex-col gap-[11px] md:mt-5 md:gap-[13px]">
      {sectors.map((sector, index) => (
        <div
          key={sector.slug}
          className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 md:grid-cols-[110px_1fr_70px] md:gap-3.5"
        >
          <span className="min-w-0 truncate font-mono text-muted-1 md:order-1 text-[11px]">
            {sector.label}
          </span>
          <span className="text-right font-mono text-[11px] font-semibold tabular-nums text-ink md:order-3 md:text-[12px]">
            {formatCount(sector.open)}
          </span>
          <div className="col-span-2 h-3 bg-line-1 md:order-2 md:col-span-1 md:h-4">
            <div
              className={`h-full ${rampColor(index, sectors.length)}`}
              style={{ width: `${Math.max(2, sector.pct)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
    <p className="mt-[18px] hidden font-mono text-muted-3 md:block text-[10px]">
      select a sector to filter the board
    </p>
  </div>
);

/** Pick a bar color from the green ramp by the sector's position in the ordered list. */
function rampColor(index: number, total: number): string {
  const ratio = total <= 1 ? 0 : index / (total - 1);
  if (ratio < 0.25) return 'bg-brand-dark';
  if (ratio < 0.5) return 'bg-brand';
  if (ratio < 0.75) return 'bg-brand-soft';
  return 'bg-line-4';
}
