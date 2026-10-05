import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { Emphasis } from '../common/Emphasis';
import { EmptyState } from '../common/EmptyState';
import { NotFound } from '../common/NotFound';
import { Rail } from '../common/Rail';
import { Reveal } from '../common/Reveal';
import { StatusNote } from '../common/StatusNote';
import { Breakdowns } from './Breakdowns';
import { CompanyFacts } from './CompanyFacts';
import { CompanyLead } from './CompanyLead';
import { DailyTable } from './DailyTable';
import { TrajectorySection } from './TrajectorySection';

import { useCompany } from '../../hooks/useCompany';

import { formatReleaseTimeLocal, formatReleaseTimeUtc, formatSpokenDateYear } from '../../lib/format';
import { seriesExtremes } from '../../lib/series';

import type { CompanyResponse } from '../../types/company';

/** Human-readable ATS provider names for the series line. */
const SOURCE_LABELS: Record<CompanyResponse['company']['source'], string> = {
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  ashby: 'Ashby',
};

/**
 * The Company screen: the lead, facts, chart, daily table, and breakdowns, or a loading, error, or empty state.
 * @returns The Company screen
 */
export const CompanyScreen: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { company, loading, error, notFound } = useCompany(slug ?? '');

  const series = useMemo(
    () => (company ? company.trajectory.points.map((point) => ({ date: point.date, value: point.count })) : []),
    [company],
  );
  const extremes = useMemo(() => (series.length > 0 ? seriesExtremes(series) : null), [series]);

  if (notFound) {
    return (
      <NotFound
        title="Company not tracked"
        body="Rampr is not counting a company at that address. It may not be on the tracked list yet."
      />
    );
  }
  if (!company) {
    return <StatusNote>{loading ? 'Reading the release.' : (error ?? 'Something went wrong.')}</StatusNote>;
  }

  const info = company.company;
  // No release has read this board yet (before the first release, or seeded since the last one), so there is no count to show.
  if (company.trajectory.daysTracked === 0 && company.open === 0) {
    return (
      <EmptyState
        title="Not counted yet"
        body={`Rampr has not read ${info.name}’s board yet. Its figures land here after the next release.`}
        note={`Next release at ${formatReleaseTimeUtc()}, ${formatReleaseTimeLocal()} locally.`}
      />
    );
  }

  const board = `${info.name}’s ${SOURCE_LABELS[info.source]} board`;

  return (
    <Rail className="pb-24">
      <p className="pt-10 text-[14px] text-ink-2">
        Read from{' '}
        {info.careersUrl ? (
          <a href={info.careersUrl} target="_blank" rel="noopener noreferrer" className="link font-medium">
            {board}
          </a>
        ) : (
          <Emphasis>{board}</Emphasis>
        )}{' '}
        since {formatSpokenDateYear(info.trackedSince)}.
      </p>
      <CompanyLead data={company} extremes={extremes} />
      <CompanyFacts data={company} extremes={extremes} />

      <div className="grid gap-9 pt-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12">
        <Reveal>
          <TrajectorySection key={slug} name={info.name} trajectory={company.trajectory} series={series} />
        </Reveal>
        <Reveal>
          <DailyTable trajectory={company.trajectory} series={series} />
        </Reveal>
      </div>

      <Reveal className="pt-14">
        <Breakdowns breakdowns={company.breakdowns} />
      </Reveal>
    </Rail>
  );
};
