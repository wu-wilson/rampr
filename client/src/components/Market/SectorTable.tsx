import React from 'react';

import { Change } from '../common/Change';

import { formatCount, formatShare } from '../../lib/format';

import type { SectorTotal } from '../../types/market';

/** The sector table's columns: sector, postings, share, bar, 7 days. Share and the bar hide on phones. */
const COLUMNS = 'grid-cols-[minmax(0,1fr)_76px_76px] px-5 md:grid-cols-[minmax(0,1fr)_76px_60px_110px_76px] md:px-4';

interface SectorTableProps {
  /** Sector totals, largest first. */
  sectors: SectorTotal[];
  /** All open postings, the denominator for each sector's share. */
  totalOpen: number;
}

/**
 * The sector table: open postings by sector, with each sector's share of all postings, a bar
 * scaled to the largest sector, and its seven-day change.
 * @param props - The sector totals and the market total
 * @returns The table
 */
export const SectorTable: React.FC<SectorTableProps> = ({ sectors, totalOpen }) => (
  <div className="-mx-5 md:mx-0">
    <div className={`grid h-[38px] items-center gap-3.5 border-y border-line text-[12px] font-medium text-ink-3 ${COLUMNS}`}>
      <span>Sector</span>
      <span className="text-right">Postings</span>
      <span className="hidden text-right md:block">Share</span>
      <span className="hidden md:block" />
      <span className="text-right">7 days</span>
    </div>
    {sectors.map((sector) => (
      <div key={sector.slug} className={`grid h-[42px] items-center gap-3.5 border-b border-line-2 text-[14px] last:border-line ${COLUMNS}`}>
        <span className="truncate font-medium tracking-[-0.005em]">{sector.label}</span>
        <span className="text-right font-medium">{formatCount(sector.open)}</span>
        <span className="hidden text-right text-ink-2 md:block">{formatShare(sector.open, totalOpen)}</span>
        <span className="hidden md:block">
          <span className="block h-1.5 bg-ink" style={{ width: `${Math.max(1, sector.pct)}%` }} />
        </span>
        <Change delta={sector.delta7d} className="text-right" />
      </div>
    ))}
  </div>
);
