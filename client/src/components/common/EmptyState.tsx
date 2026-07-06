import React from 'react';

interface EmptyStateProps {
  /** Bold headline for the state. */
  title: string;
  /** Supporting sentence beneath the headline. */
  body: string;
  /** Optional mono footnote beneath the body (e.g. the next-poll cadence on day zero). */
  note?: string;
}

/**
 * A centered, purely typographic empty state: a headline, a supporting line, and an optional
 * mono footnote. Used for the day-zero "tracking just started" screen (before the first poll)
 * and for zero-match filter results — a designed panel, never a blank screen.
 * @param props - Headline, supporting body copy, and an optional mono footnote
 * @returns The empty state
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ title, body, note }) => (
  <div className="flex flex-col items-center justify-center gap-4 px-5 py-24 text-center md:px-10">
    <h2 className="font-display font-bold text-ink text-[20px]">
      {title}
    </h2>
    <p className="max-w-sm text-muted-1 text-[13px] leading-[1.6]">
      {body}
    </p>
    {note && (
      <p className="font-mono text-muted-2 text-[11px]">
        {note}
      </p>
    )}
  </div>
);
