import React from 'react';
import { Link } from 'react-router-dom';

import { MomentumBadge } from '../common/MomentumBadge';

import { formatCount, formatPercent } from '../../lib/format';

import { DURATION, EASING } from '../../constants/animations';

import type { BoardCompany } from '../../types/board';

interface CompanyRowProps {
  /** The company to render as one leaderboard row. */
  company: BoardCompany;
}

/**
 * One leaderboard row linking to the company screen. Desktop lays rank, company, sector,
 * open roles, remote share, and momentum on a single grid line; mobile reflows into a
 * stacked block — name plus a mono meta line on the left, open and momentum stacked right.
 * @param props - The company to render
 * @returns The row link
 */
export const CompanyRow: React.FC<CompanyRowProps> = ({ company }) => (
  <Link
    to={`/company/${company.slug}`}
    className="block border-b border-line-1 px-5 py-4 transition-colors hover:bg-raised md:px-10"
    style={{ transitionDuration: `${DURATION.fast}ms`, transitionTimingFunction: EASING }}
  >
    {/* Mobile: stacked block */}
    <div className="flex items-center justify-between gap-3 md:hidden">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-display font-bold text-ink" style={{ fontSize: '15px' }}>
          {company.name}
        </span>
        <span className="truncate font-mono text-muted-2" style={{ fontSize: '10px' }}>
          {company.rank} · {company.sectorLabel} · {formatPercent(company.remotePct)} remote
        </span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="font-mono font-semibold tabular-nums text-ink" style={{ fontSize: '17px' }}>
          {formatCount(company.open)}
        </span>
        <MomentumBadge momentum={company.momentum} size={12} arrowScale={1.15} />
      </div>
    </div>

    {/* Desktop: single grid line */}
    <div className="hidden md:grid md:grid-cols-[48px_minmax(0,1fr)_150px_120px_100px_170px] md:items-center md:gap-4">
      <span className="font-mono tabular-nums text-muted-3" style={{ fontSize: '12px' }}>
        {company.rank}
      </span>
      <span className="truncate font-display font-bold text-ink" style={{ fontSize: '16px' }}>
        {company.name}
      </span>
      <span className="truncate font-mono text-muted-2" style={{ fontSize: '11px' }}>
        {company.sectorLabel}
      </span>
      <span
        className="text-right font-mono font-semibold tabular-nums text-ink"
        style={{ fontSize: '17px' }}
      >
        {formatCount(company.open)}
      </span>
      <span className="text-right font-mono tabular-nums text-muted-2" style={{ fontSize: '12px' }}>
        {formatPercent(company.remotePct)}
      </span>
      <span className="flex justify-end">
        <MomentumBadge momentum={company.momentum} size={13} arrowScale={1.15} />
      </span>
    </div>
  </Link>
);
