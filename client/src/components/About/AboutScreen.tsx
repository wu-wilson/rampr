import React from 'react';

import { Emphasis } from '../common/Emphasis';
import { Rail } from '../common/Rail';
import { StatusNote } from '../common/StatusNote';

import { useMeta } from '../../hooks/useMeta';

import { formatCount, formatReleaseTimeUtc, formatSpokenDateYear } from '../../lib/format';

import { GATING_DAYS, SERIES_DAYS } from '../../constants/config';

/** One method row: a short key on the left, the explanation on the right. */
interface MethodRow {
  key: string;
  body: React.ReactNode;
}

/**
 * The Method screen (at `/about`): what Rampr counts and how, as a light heading and
 * introduction beside six rows. The dates and counts in the rows come from the release itself.
 * @returns The Method screen
 */
export const AboutScreen: React.FC = () => {
  const { meta, loading, error } = useMeta();

  if (!meta) {
    return <StatusNote>{loading ? 'Reading the release.' : (error ?? 'Something went wrong.')}</StatusNote>;
  }

  const rows: MethodRow[] = [
    {
      key: 'What is counted',
      body: (
        <>
          The open roles on each company’s public job board, read straight from its Greenhouse, Lever, or Ashby feed.{' '}
          <Emphasis>Every posting counts as one role</Emphasis>, exactly as the company listed it. When a posting comes down, it leaves the
          next morning’s count.
        </>
      ),
    },
    {
      key: 'Cadence',
      body: (
        <>
          Rampr reads every board once a day at <Emphasis>{formatReleaseTimeUtc()}</Emphasis> and records one count per company. If a board can’t
          be read one morning, Rampr skips it rather than guess, and that company’s count stands until the next good
          read.
        </>
      ),
    },
    {
      key: 'Changes',
      body: (
        <>
          A change is simply the difference between two releases. Rampr shows it over 1, 7, 30, and 90 days, always as a
          signed figure. Changes appear once a series has <Emphasis>{GATING_DAYS} releases</Emphasis> behind it, enough for the comparison to mean
          something.
        </>
      ),
    },
    {
      key: 'History',
      body: (
        <>
          The series {meta.firstRelease ? <>began on <Emphasis>{formatSpokenDateYear(meta.firstRelease)}</Emphasis> and</> : 'begins with the first release and'} only runs
          forward. Nothing before that day was reconstructed, and nothing is ever estimated. Rampr keeps the last {SERIES_DAYS} days, which is as far back as any chart
          reaches.
        </>
      ),
    },
    {
      key: 'Sources',
      body: (
        <>
          {formatCount(meta.companyCount)} boards today: {formatCount(meta.sources.greenhouse)} on Greenhouse,{' '}
          {formatCount(meta.sources.lever)} on Lever, and {formatCount(meta.sources.ashby)} on Ashby. The feeds say nothing
          about what a company does, so Rampr assigns each one a sector by hand. Companies on other systems are not tracked.
        </>
      ),
    },
    {
      key: 'What Rampr is not',
      body: (
        <>
          Not applicant data, not salary data, not a job board, and not a forecast. Rampr counts what is posted and leaves
          the reading to you.
        </>
      ),
    },
  ];

  return (
    <Rail className="pb-24">
      <div className="grid gap-7 pt-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
        <div>
          <h1 className="max-w-[14em] font-light leading-[1.1] tracking-[-0.03em]" style={{ fontSize: 'clamp(30px, 3.8vw, 44px)' }}>
            What Rampr counts, and how.
          </h1>
          <p className="mt-[18px] max-w-[30em] text-[18px] font-light text-ink-2">
            Every morning Rampr counts the roles open on each company’s own job board and publishes the numbers as
            they are. There are no accounts, no alerts, and no models. Just the postings, counted the same way every day.
          </p>
        </div>
        <div className="-mx-5 md:mx-0">
          {rows.map((row) => (
            <div
              key={row.key}
              className="grid gap-1.5 border-t border-line-2 px-5 py-[18px] first:border-line last:border-b last:border-line sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6 md:px-0"
            >
              <div className="text-[14px] font-medium">{row.key}</div>
              <p className="max-w-[60ch] text-[15px] text-ink-2">{row.body}</p>
            </div>
          ))}
        </div>
      </div>
    </Rail>
  );
};
