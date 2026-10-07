import React from 'react';

import { BreakdownList } from './BreakdownList';

import type { BreakdownEntry, Breakdowns as BreakdownsData } from '../../types/company';
import type { BreakdownRow } from './BreakdownList';

/** Postings with no department or location come back as `Unknown`; the page says "Not stated". */
const NOT_STATED = 'Not stated';

/** Rename the server's `Unknown` bucket for the page. */
function relabel(entries: BreakdownEntry[]): BreakdownRow[] {
  return entries.map((entry) => ({ name: entry.name === 'Unknown' ? NOT_STATED : entry.name, count: entry.count }));
}

interface BreakdownsProps {
  breakdowns: BreakdownsData;
}

/**
 * The department, location, and work arrangement breakdowns, in three columns from `lg`.
 * @param props - The breakdowns
 * @returns The breakdown columns
 */
export const Breakdowns: React.FC<BreakdownsProps> = ({ breakdowns }) => {
  const { workMix } = breakdowns;
  const arrangement: BreakdownRow[] = [
    { name: 'Remote', count: workMix.remote.count, pct: workMix.remote.pct },
    { name: 'Hybrid', count: workMix.hybrid.count, pct: workMix.hybrid.pct },
    { name: 'On site', count: workMix.onsite.count, pct: workMix.onsite.pct },
    { name: NOT_STATED, count: workMix.unknown.count, pct: workMix.unknown.pct },
  ];

  return (
    <div className="grid grid-cols-1 gap-7 lg:-mx-6 lg:grid-cols-3 lg:gap-0">
      <div className="lg:px-6">
        <BreakdownList title="By department" noun="departments" rows={relabel(breakdowns.departments)} />
      </div>
      <div className="lg:border-l lg:border-line lg:px-6">
        <BreakdownList title="By location" noun="locations" rows={relabel(breakdowns.locations)} />
      </div>
      <div className="lg:border-l lg:border-line lg:px-6">
        <BreakdownList title="Work arrangement" rows={arrangement} />
      </div>
    </div>
  );
};
