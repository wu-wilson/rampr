import React from 'react';

interface StatusNoteProps {
  /** The short status or error line to show. */
  children: React.ReactNode;
}

/**
 * A status line for the pre-data loading and error states, centred in the space between
 * masthead and footer and kept to a readable measure.
 * @param props - The status text
 * @returns The status note
 */
export const StatusNote: React.FC<StatusNoteProps> = ({ children }) => (
  <p className="flex flex-1 items-center justify-center px-5 py-24 text-center text-[14px] leading-[1.6] text-ink-2">
    <span className="max-w-md">{children}</span>
  </p>
);
