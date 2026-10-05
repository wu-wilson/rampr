import React from 'react';

interface StatusNoteProps {
  /** The short status or error line to show. */
  children: React.ReactNode;
}

/**
 * A centred status line for the loading and error states, announced to assistive technology.
 * @param props - The status text
 * @returns The status note
 */
export const StatusNote: React.FC<StatusNoteProps> = ({ children }) => (
  <p role="status" className="flex flex-1 items-center justify-center px-5 py-24 text-center text-[14px] leading-[1.6] text-ink-2">
    <span className="max-w-md">{children}</span>
  </p>
);
