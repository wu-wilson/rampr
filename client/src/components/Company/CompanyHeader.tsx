import React from 'react';

import { Band } from '../common/Band';
import { MomentumBadge } from '../common/MomentumBadge';
import { MonoLabel } from '../common/MonoLabel';

import { formatCount, formatDate } from '../../lib/format';

import { DURATION } from '../../constants/animations';

import type { CompanyResponse } from '../../types/company';

interface CompanyHeaderProps {
  /** The full company payload driving every cell of the header. */
  data: CompanyResponse;
}

/**
 * The company header band. On desktop it splits into three cells — a left identity cell
 * (rank/sector caption, name, source line, and out-link to the company's own board), a
 * middle open-role count, and a right momentum tile on a raised surface. On mobile it uses
 * a distinct layout: a compact "#rank · SECTOR · PROVIDER" caption, the name, and two
 * side-by-side stat tiles; the source line and out-link are hidden.
 * @param props - The full company payload
 * @returns The company header band
 */
export const CompanyHeader: React.FC<CompanyHeaderProps> = ({ data }) => {
  const { company, open, momentum } = data;
  const provider = company.source.charAt(0).toUpperCase() + company.source.slice(1);
  const momoSub = momentum.gated ? 'unlocks at 14 days' : 'vs. 7 days ago';

  return (
    <Band>
      <div className="-mx-5 md:-mx-10 md:grid md:grid-cols-[minmax(0,1fr)_240px_240px]">
        {/* Identity cell — the full header on mobile, the left column on desktop. */}
        <div className="px-5 py-6 md:border-r md:border-line-2 md:px-10 md:py-10">
          <MonoLabel className="hidden md:inline">
            #{company.rank} on the board · {company.sectorLabel}
          </MonoLabel>
          <span
            className="font-mono uppercase text-muted-2 md:hidden"
            style={{ fontSize: '10px', letterSpacing: '0.12em' }}
          >
            #{company.rank} · {company.sectorLabel} · {company.source}
          </span>

          <h1
            className="mt-1.5 font-display font-extrabold text-ink md:mt-2"
            style={{ fontSize: 'clamp(30px, 6vw, 40px)', lineHeight: 1.04, letterSpacing: '-0.03em' }}
          >
            {company.name}
          </h1>

          <p className="mt-2.5 hidden font-mono text-muted-1 md:block" style={{ fontSize: '12px' }}>
            source: {provider} feed · tracked since {formatDate(company.trackedSince)}
          </p>
          {company.careersUrl && (
            <a
              href={company.careersUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 hidden font-mono font-semibold text-muted-1 underline underline-offset-[3px] transition-colors hover:text-ink md:inline-block"
              style={{ fontSize: '12px', transitionDuration: `${DURATION.fast}ms` }}
            >
              view roles on {company.name}&apos;s board ↗
            </a>
          )}

          {/* Mobile-only stat tiles: open now + momentum 7d, side by side. */}
          <div className="mt-4 flex gap-3 md:hidden">
            <div className="flex-1 border border-line-3 bg-raised px-4 py-3.5">
              <span className="font-mono uppercase text-muted-2" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>
                Open now
              </span>
              <div
                className="mt-0.5 font-display font-extrabold tabular-nums text-ink"
                style={{ fontSize: '30px', lineHeight: 1 }}
              >
                {formatCount(open)}
              </div>
            </div>
            <div className="flex-1 border border-line-3 bg-raised px-4 py-3.5">
              <span className="font-mono uppercase text-muted-2" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>
                Momentum 7d
              </span>
              <div className="mt-2">
                <MomentumBadge momentum={momentum} showLabel size={15} strong />
              </div>
            </div>
          </div>
        </div>

        {/* Middle cell — desktop-only open-role count. */}
        <div className="hidden md:block md:border-r md:border-line-2 md:px-8 md:py-10">
          <MonoLabel>Open roles now</MonoLabel>
          <div
            className="mt-1.5 font-display font-extrabold tabular-nums text-ink"
            style={{ fontSize: '46px', lineHeight: 1 }}
          >
            {formatCount(open)}
          </div>
        </div>

        {/* Right cell — desktop-only momentum tile on a raised surface. */}
        <div className="hidden bg-raised md:block md:px-8 md:py-10">
          <MonoLabel>Momentum · 7d</MonoLabel>
          <div className="mt-2.5">
            <MomentumBadge momentum={momentum} showLabel size={24} strong />
          </div>
          <p className="mt-2 font-mono text-muted-2" style={{ fontSize: '11px' }}>
            {momoSub}
          </p>
        </div>
      </div>
    </Band>
  );
};
