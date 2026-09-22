import React from 'react';

interface EmptyStateProps {
  /** Light headline for the state. */
  title: string;
  /** Supporting sentence beneath the headline. */
  body: string;
  /** Optional faint note beneath the body (e.g. when the first release lands). */
  note?: string;
}

/**
 * A purely typographic empty state, centred between masthead and footer: a light headline, a
 * supporting line, and an optional note, used for the day-zero screen before the first release.
 * @param props - Headline, supporting body copy, and an optional note
 * @returns The empty state
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ title, body, note }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-24 text-center">
    <h1 className="text-[26px] font-light tracking-[-0.02em]">{title}</h1>
    <p className="max-w-[44ch] text-[15px] leading-[1.55] text-ink-2">{body}</p>
    {note && <p className="text-[13px] text-ink-3">{note}</p>}
  </div>
);
