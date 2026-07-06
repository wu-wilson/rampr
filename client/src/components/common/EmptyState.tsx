import React from 'react';

import { RamprMark } from './RamprMark';

interface EmptyStateProps {
  /** Bold headline for the state. */
  title: string;
  /** Supporting sentence beneath the headline. */
  body: string;
}

/**
 * A centered empty state built around the rampr mark. Used for the day-zero
 * "tracking just started" screen (before the first poll) and for zero-match filter
 * results — a designed panel, never a blank screen.
 * @param props - Headline and supporting body copy
 * @returns The empty state
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ title, body }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
    <RamprMark size={44} className="opacity-70" />
    <h2 className="font-display font-bold text-ink" style={{ fontSize: '20px' }}>
      {title}
    </h2>
    <p className="max-w-sm text-muted-1" style={{ fontSize: '13px', lineHeight: 1.6 }}>
      {body}
    </p>
  </div>
);
