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

/**
 * The company header band: a left identity cell (rank/sector caption, name, and — desktop only —
 * the source line and out-link to the company's own board) paired with the open-role count and
 * 7-day momentum as two taped post-its. The notes cluster to the right on desktop and drop below
 * the name on mobile, where the caption compacts to "#rank · SECTOR · PROVIDER".
 * @param props - The full company payload
 * @returns The company header band
 */
export const CompanyHeader: React.FC<CompanyHeaderProps> = ({ data }) => {
  const { company, open, momentum } = data;
  const provider = company.source.charAt(0).toUpperCase() + company.source.slice(1);
  const momoSub = momentum.gated ? 'unlocks at 14 days' : 'vs. 7 days ago';

  return (
    <Band className="py-7 md:py-11">
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-12">
        {/* Identity: caption, name, and — desktop only — the source line and out-link. */}
        <div>
          <MonoLabel className="hidden md:inline">
            #{company.rank} on the board · {company.sectorLabel}
          </MonoLabel>
          <span className="font-mono uppercase text-muted-2 md:hidden text-[10px] tracking-[0.12em]">
            #{company.rank} · {company.sectorLabel} · {company.source}
          </span>

          <h1
            className="mt-1.5 font-display font-extrabold text-ink md:mt-2 leading-[1.04] tracking-[-0.03em]"
            style={{ fontSize: 'clamp(30px, 6vw, 40px)' }}
          >
            {company.name}
          </h1>

          <p className="mt-2.5 hidden font-mono text-muted-1 md:block text-[12px]">
            source: {provider} feed · tracked since {formatDate(company.trackedSince)}
          </p>
          {company.careersUrl && (
            <a
              href={company.careersUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 hidden font-mono font-semibold text-muted-1 underline underline-offset-[3px] transition-colors hover:text-ink md:inline-block text-[12px]"
              style={{ transitionDuration: `${DURATION.fast}ms` }}
            >
              view roles on {company.name}&apos;s board ↗
            </a>
          )}

          {/* Mobile stat post-its: open now + momentum 7d, side by side below the name. */}
          <div className="mt-6 grid grid-cols-2 items-start gap-4 md:hidden">
            <PostItNote index={0} className="px-4 py-4">
              <MonoLabel>Open now</MonoLabel>
              <div className="mt-1 font-display font-extrabold tabular-nums text-ink text-[30px] leading-none">
                {formatCount(open)}
              </div>
            </PostItNote>
            <PostItNote index={1} className="px-4 py-4">
              <MonoLabel>Momentum 7d</MonoLabel>
              <div className="mt-2">
                <MomentumBadge momentum={momentum} showLabel size={15} strong />
              </div>
            </PostItNote>
          </div>
        </div>

        {/* Desktop stat post-its: open count + 7-day momentum, clustered to the right. */}
        <div className="hidden md:grid md:w-[440px] md:grid-cols-2 md:items-start md:gap-7">
          <PostItNote index={0} className="px-5 py-5">
            <MonoLabel>Open roles now</MonoLabel>
            <div className="mt-1.5 font-display font-extrabold tabular-nums text-ink text-[46px] leading-none">
              {formatCount(open)}
            </div>
          </PostItNote>
          <PostItNote index={1} className="px-5 py-5">
            <MonoLabel>Momentum · 7d</MonoLabel>
            <div className="mt-2.5">
              <MomentumBadge momentum={momentum} showLabel size={24} strong />
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
