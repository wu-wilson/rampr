import React from 'react';

import { MonoLabel } from '../common/MonoLabel';

import { formatPollTimeLocal } from '../../lib/format';

/** One methodology row: a mono key on the left, an explanatory value on the right. */
interface AboutRow {
  key: string;
  value: string;
}

/**
 * The About screen: a static explainer of what rampr counts and how, as a hero paragraph
 * beside four method rows — what is counted, the daily poll cadence, forward-only trends that
 * unlock at 14 snapshots, and what rampr deliberately is not. The grid spans the full rail
 * with padding inside each cell, so the row hairlines reach the rail's right edge.
 * @returns The About screen
 */
export const AboutScreen: React.FC = () => {
  const rows: AboutRow[] = [
    {
      key: 'What is counted',
      value:
        "Open roles listed on each company's public job board — Greenhouse, Lever and Ashby feeds. A role counts once; closed or removed postings drop out at the next poll.",
    },
    {
      key: 'Cadence',
      value: `One poll per day at ${formatPollTimeLocal()}. Each poll writes one open-count snapshot per company. Counts you see are at most 24 hours old.`,
    },
    {
      key: 'Trends',
      value:
        'History accrues forward from the day tracking started — there is no backfill. Trend charts and momentum badges unlock once 14 daily snapshots exist; snapshot counts are live from day one.',
    },
    {
      key: 'What rampr is not',
      value:
        'Not applicant data, not salary data, not a job board. No accounts, no alerts, no editorializing — the count is the story.',
    },
  ];

  return (
    <div className="grid md:grid-cols-[380px_1fr]">
      <div className="border-b border-line-2 px-5 py-7 md:border-b-0 md:border-r md:border-line-2 md:px-10 md:py-11">
        <h1
          className="font-display font-extrabold text-ink tracking-[-0.03em] leading-[1.15]"
          style={{ fontSize: 'clamp(24px, 6vw, 32px)' }}
        >
          What rampr counts, and how.
        </h1>
        <p
          className="mt-4 hidden font-display font-medium text-muted-1 md:block text-[14px] leading-[1.7]"
          style={{ maxWidth: '340px' }}
        >
          A public, read-only board. No accounts, no alerts, no AI — just companies' own postings, counted the same way
          every day.
        </p>
      </div>
      <div>
        {rows.map((row, index) => (
          <div
            key={row.key}
            className={`grid gap-2 px-5 py-6 md:grid-cols-[180px_1fr] md:gap-6 md:px-10 ${
              index < rows.length - 1 ? 'border-b border-line-1' : ''
            }`}
          >
            <MonoLabel className="md:pt-0.5">{row.key}</MonoLabel>
            <p className="font-display font-medium text-ink text-[13px] leading-[1.65]">
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
