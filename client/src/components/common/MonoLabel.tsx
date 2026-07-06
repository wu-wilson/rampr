import React from 'react';

interface MonoLabelProps {
  children: React.ReactNode;
  /** Extra classes appended after the base label styles (color, spacing). */
  className?: string;
}

/**
 * A small uppercase tracked mono micro-label — the editorial caption used above values,
 * on column headers, and on section titles throughout rampr.
 * @param props - Label content and optional extra classes
 * @returns The styled label span
 */
export const MonoLabel: React.FC<MonoLabelProps> = ({ children, className }) => (
  <span
    className={`font-mono uppercase tracking-[0.12em] text-muted-2 text-[10px] md:text-[11px] ${className ?? ''}`}
  >
    {children}
  </span>
);
