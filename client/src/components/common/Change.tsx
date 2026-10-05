import React from 'react';

import { formatDelta } from '../../lib/format';

/** The direction word that rides along as the hover title, so the meaning is never colour alone. */
const TITLES = { up: 'Rose', down: 'Fell', flat: 'Held' } as const;

interface ChangeProps {
  /** The signed change, or null while the series is too short to compare. */
  delta: number | null;
  /** Extra classes (size, alignment). */
  className?: string;
}

/**
 * A signed change figure, its sign carrying the direction, reading "new" until a comparison exists.
 * @param props - The signed change and extra classes
 * @returns The figure
 */
export const Change: React.FC<ChangeProps> = ({ delta, className }) => {
  if (delta === null) {
    return (
      <span className={`whitespace-nowrap text-[12.5px] text-ink-3 ${className ?? ''}`} title="No comparison yet">
        new
      </span>
    );
  }
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const colour = direction === 'up' ? 'text-up' : direction === 'down' ? 'text-down' : 'text-flat';

  return (
    <span className={`whitespace-nowrap font-medium ${colour} ${className ?? ''}`} title={TITLES[direction]}>
      {formatDelta(delta)}
    </span>
  );
};
