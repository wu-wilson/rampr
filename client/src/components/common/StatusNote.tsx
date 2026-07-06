import React from 'react';

interface StatusNoteProps {
  /** The short status or error line to show. */
  children: React.ReactNode;
}

/**
 * A centered status line for the pre-data loading and error states — kept within a readable
 * measure and clear of the rail edges on mobile via the standard gutter.
 * @param props - The status text
 * @returns The status note
 */
export const StatusNote: React.FC<StatusNoteProps> = ({ children }) => (
  <p
    className="mx-auto max-w-md px-5 py-24 text-center text-muted-2 text-[13px] leading-[1.6]"
  >
    {children}
  </p>
);
