import React from 'react';

import { Change } from '../common/Change';
import { Emphasis } from '../common/Emphasis';

import { formatCount, formatPercent, formatReleaseTimeUtc, formatSignedPercent } from '../../lib/format';
import { changeVerb } from '../../lib/series';

import { GATING_DAYS } from '../../constants/config';

import type { MarketSummary } from '../../types/board';

/** Capitalize a word for the start of a sentence. */
const capitalize = (word: string): string => word[0].toUpperCase() + word.slice(1);

/** The four trailing windows the facts row reports, with their labels and lengths. */
const WINDOWS: Array<{ key: keyof MarketSummary['changes']; label: string; days: number }> = [
  { key: 'day1', label: '1 day', days: 1 },
  { key: 'day7', label: '7 days', days: 7 },
  { key: 'day30', label: '30 days', days: 30 },
  { key: 'day90', label: '90 days', days: 90 },
];

/** The lead sentences beneath the figure: the seven-day move, then how many boards sit at a series high and how concentrated the postings are. */
const LeadSentence: React.FC<LeadPanelProps> = ({ market }) => {
  const delta = market.changes.day7;
  if (delta === null) {
    return (
      <>
        Counted every morning at {formatReleaseTimeUtc()}. Changes over 1 and 7 days appear once the series has {GATING_DAYS} releases, and over 30 and 90 days once it runs that long.
      </>
    );
  }
  const move =
    delta === 0 ? (
      <>Held steady over the last seven days.</>
    ) : (
      <>
        {capitalize(changeVerb(delta))} by <Emphasis>{formatCount(Math.abs(delta))}</Emphasis> over the last seven days.
      </>
    );
  const high = market.atHigh90;
  return (
    <>
      {move}{' '}
      {high !== null && (
        <>
          <Emphasis>{formatCount(high)}</Emphasis> {high === 1 ? 'board is' : 'boards are'} at a series high, and the ten
          largest hold <Emphasis>{formatPercent(market.topTenShare)}</Emphasis> of all postings.
        </>
      )}
    </>
  );
};

interface LeadPanelProps {
  market: MarketSummary;
}

/**
 * The lead: the heading and figure, the sentences, and the facts row, as three blocks a taller panel spaces evenly.
 * @param props - The market summary
 * @returns The lead content
 */
export const LeadPanel: React.FC<LeadPanelProps> = ({ market }) => (
  <>
    <div>
      <h1 className="text-[13px] font-medium text-ink-2">
        Open postings on {formatCount(market.companyCount)} company boards
      </h1>
      <div
        className="-ml-[0.15em] mt-2.5 font-light leading-[0.92] tracking-[-0.045em]"
        style={{ fontSize: 'clamp(76px, 10vw, 128px)' }}
      >
        {formatCount(market.totalOpen)}
      </div>
    </div>
    <p className="mt-[22px] max-w-[30em] text-[19px] font-light leading-[1.45] text-ink-2 [text-wrap:pretty]">
      <LeadSentence market={market} />
    </p>
    <dl className="mt-[30px] grid grid-cols-2 border-t border-line sm:grid-cols-4">
      {WINDOWS.map((range) => {
        const delta = market.changes[range.key];
        const base = market.changeBases[range.key];
        return (
          <div key={range.key} className="pr-4 pt-3.5">
            <dt className="text-[12.5px] font-medium text-ink-3">{range.label}</dt>
            <dd className="mt-[3px] text-[20px] font-medium tracking-[-0.02em]">
              {delta === null ? (
                <span className="inline-block text-[13px] font-normal leading-snug text-ink-3">
                  {range.days < GATING_DAYS ? `at ${GATING_DAYS} releases` : 'no release that far back'}
                </span>
              ) : (
                <>
                  <Change delta={delta} />{' '}
                  {base !== null && (
                    <small className="text-[12.5px] font-medium tracking-normal text-ink-3">{formatSignedPercent(delta, base)}</small>
                  )}
                </>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  </>
);
