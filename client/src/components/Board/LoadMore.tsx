import React from 'react';

import { formatCount } from '../../lib/format';

import { DURATION } from '../../constants/animations';
import { PAGE_SIZE } from '../../constants/config';

interface LoadMoreProps {
  /** Companies still hidden beyond what's currently shown. */
  remaining: number;
  /** Reveal the next page. */
  onClick: () => void;
}

/**
 * Centered outline control revealing the next page (up to PAGE_SIZE more rows).
 * @param props - Remaining hidden companies and the reveal handler
 * @returns The load-more button
 */
export const LoadMore: React.FC<LoadMoreProps> = ({ remaining, onClick }) => {
  const next = Math.min(PAGE_SIZE, remaining);

  return (
    <div className="flex justify-center px-5 pt-5 md:px-10">
      <button
        type="button"
        onClick={onClick}
        className="w-full border border-line-4 px-6 py-2.5 font-mono uppercase text-muted-1 transition-colors hover:border-ink hover:text-ink md:w-auto text-[11px] tracking-[0.08em]"
        style={{ transitionDuration: `${DURATION.fast}ms` }}
      >
        Load {formatCount(next)} more ↓
      </button>
    </div>
  );
};
