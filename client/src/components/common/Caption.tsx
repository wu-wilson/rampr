import React from 'react';

interface CaptionProps {
  /** What the figure shows, e.g. `Open postings by company`. */
  title: string;
  /** Controls for the right side, e.g. the table controls or the range tabs. */
  children?: React.ReactNode;
}

/**
 * The caption row above a table or chart: the title, with any controls on the right.
 * @param props - The title and any right-side controls
 * @returns The caption row
 */
export const Caption: React.FC<CaptionProps> = ({ title, children }) => (
  <div className="mb-3.5 flex min-h-[34px] flex-wrap items-center justify-between gap-x-6 gap-y-3">
    <h2 className="text-[15px] font-medium tracking-[-0.005em]">{title}</h2>
    {children}
  </div>
);
