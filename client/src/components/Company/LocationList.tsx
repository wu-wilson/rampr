import React from 'react';

import { MonoLabel } from '../common/MonoLabel';

import { formatCount } from '../../lib/format';

import type { LocationCount } from '../../types/company';

interface LocationListProps {
  /** Location breakdown rows, ordered by count. */
  locations: LocationCount[];
}

/**
 * Top locations as hairline-separated rows of name + open-role count. Renders the inner
 * content of the breakdowns band's middle cell. Snapshot data, always live — never gated.
 * @param props - The location breakdown rows
 * @returns The location list cell
 */
export const LocationList: React.FC<LocationListProps> = ({ locations }) => (
  <div>
    <MonoLabel className="mb-3 block md:mb-[18px]">By location</MonoLabel>
    <ul className="flex flex-col">
      {locations.map((location) => (
        <li
          key={location.name}
          className="flex items-baseline justify-between gap-3 border-b border-line-1 py-[9px] md:py-2.5"
          style={{ fontSize: '12px' }}
        >
          <span className="min-w-0 truncate font-semibold text-ink">{location.name}</span>
          <span className="font-mono tabular-nums text-muted-1">{formatCount(location.count)}</span>
        </li>
      ))}
      {locations.length === 0 && (
        <li className="text-muted-3" style={{ fontSize: '12px' }}>
          No locations reported.
        </li>
      )}
    </ul>
  </div>
);
