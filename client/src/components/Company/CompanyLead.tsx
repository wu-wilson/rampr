import React from 'react';

import { Change } from '../common/Change';

import { formatCount } from '../../lib/format';
import { changeVerb } from '../../lib/series';

import { GATING_DAYS, SERIES_DAYS } from '../../constants/config';

import type { SeriesExtremes } from '../../lib/series';
import type { CompanyResponse } from '../../types/company';

interface CompanyLeadProps {
  data: CompanyResponse;
  /** The series high and low, or null while the series is gated. */
  extremes: SeriesExtremes | null;
}

/** Emphasis inside the lead sentence. */
const B: React.FC<{ children: React.ReactNode }> = ({ children }) => <b className="font-medium text-ink">{children}</b>;

/** The company's lead sentences: the seven-day move, whether it landed at a series high or low, then how many postings are remote. */
const LeadSentence: React.FC<CompanyLeadProps> = ({ data, extremes }) => {
  const { open, delta7d, breakdowns } = data;
  const remote = breakdowns.workMix.remote.count;
  const remoteClause =
    remote === 0 ? (
      <>None are listed as remote.</>
    ) : (
      <>
        Of those, <B>{formatCount(remote)}</B> {remote === 1 ? 'is' : 'are'} listed as remote.
      </>
    );

  if (delta7d === null) {
    return (
      <>
        <B>{formatCount(open)}</B> open postings this release. {remoteClause}{' '}
        {data.trajectory.gated ? `Changes appear once the series has ${GATING_DAYS} releases.` : 'No release seven days back to compare with yet.'}
      </>
    );
  }

  const span = data.trajectory.points.length >= SERIES_DAYS ? `a ${SERIES_DAYS}-day` : 'the series';
  // A flat series sits at its own high and low at once, which says nothing, so it claims neither.
  const moved = extremes !== null && extremes.high.value > extremes.low.value;
  const standing =
    moved && open >= extremes.high.value ? `, ${span} high` : moved && open <= extremes.low.value ? `, ${span} low` : '';
  const move =
    delta7d === 0 ? (
      <>
        Open postings held at <B>{formatCount(open)}</B> over the last seven days{standing}.
      </>
    ) : (
      <>
        Open postings {changeVerb(delta7d)} by <B>{formatCount(Math.abs(delta7d))}</B> over the last seven days to{' '}
        <B>{formatCount(open)}</B>
        {standing}.
      </>
    );
  return (
    <>
      {move} {remoteClause}
    </>
  );
};

/**
 * The company lead: the name and sentence on the left, the open-postings figure with its
 * seven-day change on the right. Stacks on phones with the figure beneath the sentence.
 * @param props - The company payload and the series extremes
 * @returns The lead
 */
export const CompanyLead: React.FC<CompanyLeadProps> = ({ data, extremes }) => (
  <div className="grid items-end gap-5 pb-[26px] pt-2.5 md:grid-cols-[minmax(0,1fr)_auto] md:gap-10">
    <div>
      <h1 className="font-light leading-none tracking-[-0.035em]" style={{ fontSize: 'clamp(44px, 6vw, 64px)' }}>
        {data.company.name}
      </h1>
      <p className="mt-4 max-w-[30em] text-[19px] font-light leading-[1.45] text-ink-2 [text-wrap:pretty]">
        <LeadSentence data={data} extremes={extremes} />
      </p>
    </div>
    <div className="md:text-right">
      <div className="text-[12.5px] font-medium text-ink-3">Open postings</div>
      <div className="-mr-[0.03em] font-light leading-[0.92] tracking-[-0.045em]" style={{ fontSize: 'clamp(64px, 8vw, 104px)' }}>
        {formatCount(data.open)}
      </div>
      <div className="mt-2 text-[15px]">
        {data.delta7d === null ? (
          <span className="text-ink-3">{data.trajectory.gated ? `changes at ${GATING_DAYS} releases` : 'no release that far back'}</span>
        ) : (
          <>
            <Change delta={data.delta7d} /> <span className="text-ink-3">over 7 days</span>
          </>
        )}
      </div>
    </div>
  </div>
);
