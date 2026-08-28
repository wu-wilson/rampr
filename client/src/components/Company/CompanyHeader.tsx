import React from 'react';

import { Band } from '../common/Band';
import { MomentumBadge } from '../common/MomentumBadge';
import { MonoLabel } from '../common/MonoLabel';
import { PostItNote } from '../common/PostItNote';

import { formatCount, formatDate } from '../../lib/format';

import { DURATION } from '../../constants/animations';

import type { CompanyResponse } from '../../types/company';

interface CompanyHeaderProps {
  /** The full company payload driving every cell of the header. */
  data: CompanyResponse;
}

/** Human-readable ATS provider names for the header caption. */
const SOURCE_LABELS: Record<CompanyResponse['company']['source'], string> = {
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  ashby: 'Ashby',
};

/**
 * The company header band: a left identity cell (rank/sector/provider caption, name, the tracked-
 * since line, and the out-link to the company's own board) paired with the open-role count and
 * 7-day momentum as two taped post-its. The caption ("Ranked #N / filed under SECTOR / via PROVIDER")
 * is shared across breakpoints; the notes cluster right on desktop and drop below the name on mobile.
 * @param props - The full company payload
 * @returns The company header band
 */
export const CompanyHeader: React.FC<CompanyHeaderProps> = ({ data }) => {
  const { company, open, momentum } = data;
  const momoSub = momentum.gated ? 'unlocks at 14 days' : 'vs. 7 days ago';

  return (
    <Band className="py-7 md:py-11">
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-12">
        {/* Identity: caption, name, tracked-since line, and out-link to the company's board. */}
        <div>
          {/* Non-breaking spaces keep each phrase whole, so a narrow viewport wraps at a slash, never mid-phrase. */}
          <MonoLabel>
            Ranked&nbsp;#{company.rank} / filed&nbsp;under&nbsp;{company.sectorLabel} / via&nbsp;
            {SOURCE_LABELS[company.source]}
          </MonoLabel>

          <h1
            className="mt-1.5 font-display font-extrabold text-ink md:mt-2 leading-[1.04] tracking-[-0.03em]"
            style={{ fontSize: 'clamp(30px, 6vw, 40px)' }}
          >
            {company.name}
          </h1>

          <p className="mt-2.5 font-mono text-muted-1 text-[12px]">
            tracked since {formatDate(company.trackedSince)}
          </p>
          {company.careersUrl && (
            <a
              href={company.careersUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-block font-mono font-semibold text-muted-1 underline underline-offset-[3px] transition-colors hover:text-ink text-[12px]"
              style={{ transitionDuration: `${DURATION.fast}ms` }}
            >
              view roles on {company.name}&apos;s board ↗
            </a>
          )}

          {/* Mobile stat post-its: open now + momentum 7d, side by side below the name. */}
          <div className="mt-6 grid grid-cols-2 items-start gap-4 md:hidden">
            <PostItNote index={0} className="px-4 py-4">
              <MonoLabel>Open now</MonoLabel>
              <div className="mt-1 font-display font-extrabold tabular-nums text-ink text-[28px] leading-none">
                {formatCount(open)}
              </div>
            </PostItNote>
            <PostItNote index={1} className="px-4 py-4">
              <MonoLabel>7-day momentum</MonoLabel>
              <div className="mt-2">
                <MomentumBadge momentum={momentum} size={20} strong />
              </div>
            </PostItNote>
          </div>
        </div>

        {/* Desktop stat post-its: open count + 7-day momentum, clustered to the right. */}
        <div className="hidden md:grid md:w-[440px] md:grid-cols-2 md:items-start md:gap-7">
          <PostItNote index={0} className="px-5 py-5">
            <MonoLabel>Open roles now</MonoLabel>
            <div className="mt-1.5 font-display font-extrabold tabular-nums text-ink text-[43px] leading-none">
              {formatCount(open)}
            </div>
          </PostItNote>
          <PostItNote index={1} className="px-5 py-5">
            <MonoLabel>7-day momentum</MonoLabel>
            <div className="mt-2.5">
              <MomentumBadge momentum={momentum} size={24} strong />
            </div>
            <p className="mt-2 font-mono text-muted-2 text-[11px]">
              {momoSub}
            </p>
          </PostItNote>
        </div>
      </div>
    </Band>
  );
};
