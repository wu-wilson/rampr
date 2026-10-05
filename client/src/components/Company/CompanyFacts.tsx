import React from 'react';

import { formatCount, formatOrdinal, formatShare, formatShortDate } from '../../lib/format';

import { GATING_DAYS, SERIES_DAYS } from '../../constants/config';

import type { SeriesExtremes } from '../../lib/series';
import type { CompanyResponse } from '../../types/company';

interface CompanyFactsProps {
  data: CompanyResponse;
  /** The series high and low, or null while the series is gated. */
  extremes: SeriesExtremes | null;
}

/** One cell of the facts row: a label over a value with an optional small qualifier. */
const Fact: React.FC<{ label: string; value: React.ReactNode; small?: string }> = ({ label, value, small }) => (
  <div className="py-3.5 pl-5 pr-4 last:col-span-full sm:last:col-span-1 md:pl-0">
    <dt className="text-[12.5px] font-medium text-ink-3">{label}</dt>
    <dd className="mt-[3px] whitespace-nowrap text-[17px] font-medium tracking-[-0.015em]">
      {value}
      {small && <small className="ml-1.5 text-[12.5px] font-normal tracking-normal text-ink-3">{small}</small>}
    </dd>
  </div>
);

/**
 * The facts row under the company lead: overall and sector rank, sector share, and the series high and low.
 * @param props - The company payload and the series extremes
 * @returns The facts row
 */
export const CompanyFacts: React.FC<CompanyFactsProps> = ({ data, extremes }) => {
  const { company } = data;
  const { points } = data.trajectory;
  const latest = points[points.length - 1];
  const span = points.length >= SERIES_DAYS ? `${SERIES_DAYS}-day` : 'Series';
  const when = (date: string): string => (date === latest.date ? 'latest' : formatShortDate(date));
  const pending = <span className="text-[13px] font-normal text-ink-3">at {GATING_DAYS} releases</span>;

  return (
    <dl className="-mx-5 grid grid-cols-2 border-y border-line sm:grid-cols-5 md:mx-0">
      <Fact label="Rank, all boards" value={formatOrdinal(company.rank)} small={`of ${formatCount(company.companyCount)}`} />
      <Fact label={`Rank in ${company.sectorLabel}`} value={formatOrdinal(company.sectorRank)} small={`of ${formatCount(company.sectorCompanyCount)}`} />
      <Fact label={`Share of ${company.sectorLabel}`} value={formatShare(data.open, company.sectorOpen)} />
      <Fact label={`${span} high`} value={extremes ? formatCount(extremes.high.value) : pending} small={extremes ? when(extremes.high.date) : undefined} />
      <Fact label={`${span} low`} value={extremes ? formatCount(extremes.low.value) : pending} small={extremes ? when(extremes.low.date) : undefined} />
    </dl>
  );
};
