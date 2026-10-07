import React from 'react';
import { Link } from 'react-router-dom';

import { Change } from '../common/Change';
import { BOARD_COLUMNS } from './TableHeader';

import { formatCount } from '../../lib/format';

import { TRANSITION } from '../../constants/animations';

import type { BoardCompany } from '../../types/board';

interface CompanyRowProps {
  company: BoardCompany;
}

/**
 * One company table row, linking to the company page and keyed by `data-key` so a sort can slide it.
 * @param props - The company to render
 * @returns The row link
 */
export const CompanyRow: React.FC<CompanyRowProps> = ({ company }) => (
  <Link
    to={`/company/${company.slug}`}
    data-key={company.slug}
    className={`grid h-[46px] items-center gap-3.5 border-b border-line-2 bg-paper text-[14px] transition-colors last:border-line hover:bg-hover focus-visible:outline-offset-[-2px] ${BOARD_COLUMNS}`}
    style={TRANSITION}
  >
    <span className="text-right text-[13px] text-ink-3">{company.rank}</span>
    <span className="truncate font-medium tracking-[-0.005em]">{company.name}</span>
    <span className="hidden truncate text-[13px] text-ink-2 md:block">{company.sectorLabel}</span>
    <span className="text-right font-medium">{formatCount(company.open)}</span>
    <Change delta={company.delta7d} className="text-right" />
    <Change delta={company.delta30d} className="hidden text-right md:block" />
  </Link>
);
