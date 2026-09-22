import React, { useState } from 'react';

import { formatCount, formatPercent } from '../../lib/format';

import { BREAKDOWN_PREVIEW_ROWS } from '../../constants/config';

/** One row of a breakdown: a name, a count, and an optional share. */
export interface BreakdownRow {
  name: string;
  count: number;
  /** Whole-number percent of open postings, shown small after the count. */
  pct?: number;
}

interface BreakdownListProps {
  title: string;
  /** Plural noun for the "See all" link (e.g. `departments`); when given, the title also shows the row count. */
  noun?: string;
  rows: BreakdownRow[];
}

/**
 * One breakdown column: a titled list of name and count rows on hairlines. Given a noun, a long
 * list shows its first `BREAKDOWN_PREVIEW_ROWS` rows with a link to see the rest.
 * @param props - The title, the row noun, and the rows
 * @returns The column
 */
export const BreakdownList: React.FC<BreakdownListProps> = ({ title, noun, rows }) => {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded || !noun ? rows : rows.slice(0, BREAKDOWN_PREVIEW_ROWS);

  return (
    <section className="-mx-5 md:mx-0">
      <div className="flex items-baseline justify-between border-b border-line px-5 pb-2.5 text-[14px] font-medium md:px-0">
        <h2>{title}</h2>
        {noun && (
          <span className="text-[12.5px] font-normal text-ink-3">
            {formatCount(rows.length)} listed
          </span>
        )}
      </div>
      {shown.map((row) => (
        <div key={row.name} className="flex h-[38px] items-center justify-between gap-3 border-b border-line-2 px-5 text-[13.5px] md:px-0">
          <span className="min-w-0 truncate">{row.name}</span>
          <span className="inline-flex items-baseline font-medium">
            {formatCount(row.count)}
            {row.pct !== undefined && <small className="ml-1.5 text-[12.5px] font-normal text-ink-3">{formatPercent(row.pct)}</small>}
          </span>
        </div>
      ))}
      {rows.length === 0 && <p className="border-b border-line-2 px-5 py-2.5 text-[13.5px] text-ink-3 md:px-0">None listed.</p>}
      {noun && rows.length > BREAKDOWN_PREVIEW_ROWS && (
        <div className="px-5 pt-2.5 text-[13px] md:px-0">
          <button type="button" onClick={() => setExpanded((prev) => !prev)} className="link font-medium">
            {expanded ? `Show the first ${BREAKDOWN_PREVIEW_ROWS} ${noun}` : `See all ${formatCount(rows.length)} ${noun}`}
          </button>
        </div>
      )}
    </section>
  );
};
