import React from 'react';

import { Change } from '../common/Change';

import { formatCount, formatPercent, formatReleaseTimeUtc, formatSignedPercent } from '../../lib/format';
import { changeVerb } from '../../lib/series';

import { GATING_DAYS } from '../../constants/config';

import type { MarketSummary } from '../../types/board';

interface LeadPanelProps {
  market: MarketSummary;
}

/** Capitalize a word for the start of a sentence. */
const capitalize = (word: string): string => word[0].toUpperCase() + word.slice(1);

/** The four trailing windows the facts row reports, with their labels. */
const WINDOWS: Array<{ key: keyof MarketSummary['changes']; label: string }> = [
  { key: 'day1', label: '1 day' },
  { key: 'day7', label: '7 days' },
  { key: 'day30', label: '30 days' },
  { key: 'day90', label: '90 days' },
];

/** The lead sentences beneath the figure: the seven-day move, then how many boards sit at a high, named for the series depth, and how concentrated the postings are. */
const LeadSentence: React.FC<LeadPanelProps> = ({ market }) => {
  const delta = market.changes.day7;
  if (delta === null) {
    return (
      <>
        Counted every morning at {formatReleaseTimeUtc()}. Changes over 1, 7, 30, and 90 days appear once the series has {GATING_DAYS} releases.
      </>
    );
  }
  const move =
    delta === 0 ? (
      <>Held steady over the last seven days.</>
    ) : (
      <>
        {capitalize(changeVerb(delta))} by <b className="font-medium text-ink">{formatCount(Math.abs(delta))}</b> over the last seven days.
      </>
    );
  const high = market.atHigh90;
  return (
    <>
      {move}{' '}
      {high !== null && (
        <>
          <b className="font-medium text-ink">{formatCount(high)}</b> {high === 1 ? 'board is' : 'boards are'} at a series high, and the ten
          largest hold <b className="font-medium text-ink">{formatPercent(market.topTenShare)}</b> of all postings.
        </>
      )}
    </>
  );
};

/**
 * The lead: the page heading naming the count, the figure itself, the sentences, and the facts
 * row of changes over 1, 7, 30, and 90 days with their percentages.
 * @param props - The market summary and how many releases the series holds
 * @returns The lead content
 */
export const LeadPanel: React.FC<LeadPanelProps> = ({ market }) => (
  <>
    <h1 className="text-[13px] font-medium text-ink-2">
      Open postings on {formatCount(market.companyCount)} company boards
    </h1>
    <div
      className="-ml-[0.15em] mt-2.5 font-light leading-[0.92] tracking-[-0.045em]"
      style={{ fontSize: 'clamp(76px, 10vw, 128px)' }}
    >
      {formatCount(market.totalOpen)}
    </div>
    <p className="mt-[22px] max-w-[30em] text-[19px] font-light leading-[1.45] text-ink-2 [text-wrap:pretty]">
      <LeadSentence market={market} />
    </p>
    <dl className="mt-[30px] grid grid-cols-2 border-t border-line sm:grid-cols-4">
      {WINDOWS.map((range) => {
        const delta = market.changes[range.key];
        return (
          <div key={range.key} className="pr-4 pt-3.5">
            <dt className="text-[12.5px] font-medium text-ink-3">{range.label}</dt>
            <dd className="mt-[3px] whitespace-nowrap text-[20px] font-medium tracking-[-0.02em]">
              {delta === null ? (
                <span className="text-[13px] font-normal text-ink-3">{market.changes.day7 === null ? `at ${GATING_DAYS} releases` : 'no release that far back'}</span>
              ) : (
                <>
                  <Change delta={delta} />
                  <small className="ml-1.5 text-[12.5px] font-medium tracking-normal text-ink-3">
                    {formatSignedPercent(delta, market.totalOpen)}
                  </small>
                </>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  </>
);
