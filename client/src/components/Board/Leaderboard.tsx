import React from 'react';

import { CompanyRow } from './CompanyRow';

import type { BoardCompany } from '../../types/board';

interface LeaderboardProps {
  /** The companies to list, already ordered by the active sort. */
  companies: BoardCompany[];
}

const HEADERS: Array<{ label: string; align?: 'right' }> = [
  { label: '#' },
  { label: 'Company' },
  { label: 'Sector' },
  { label: 'Open roles', align: 'right' },
  { label: 'Remote', align: 'right' },
  { label: 'Momentum · 7d', align: 'right' },
];

/** Desktop-only column header aligned to the row grid; hidden on mobile. */
const ColumnHeader: React.FC = () => (
  <div className="hidden border-b border-line-1 px-5 py-3.5 md:grid md:grid-cols-[48px_minmax(0,1fr)_150px_120px_100px_170px] md:items-center md:gap-4 md:px-10">
    {HEADERS.map((header) => (
      <span
        key={header.label}
        className={`font-mono uppercase text-muted-3 text-[10px] tracking-[0.14em] ${header.align === 'right' ? 'text-right' : ''}`}
      >
        {header.label}
      </span>
    ))}
  </div>
);

/**
 * The ranked leaderboard: a desktop column header over the full-width company rows. Not
 * wrapped in a band — each row draws its own hairline spanning the rail.
 * @param props - The companies to list
 * @returns The leaderboard
 */
export const Leaderboard: React.FC<LeaderboardProps> = ({ companies }) => (
  <div>
    <ColumnHeader />
    {companies.map((company) => (
      <CompanyRow key={company.slug} company={company} />
    ))}
  </div>
);
