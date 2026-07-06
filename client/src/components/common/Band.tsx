import React from 'react';

interface BandProps {
  children: React.ReactNode;
  /** Extra classes for the inner padded content (usually vertical padding). */
  className?: string;
  /** When false, omits the bottom hairline (e.g. the last band before the footer). */
  divider?: boolean;
}

/**
 * A full-width horizontal band inside the 1280px rail: the sectioning hairline spans the
 * whole rail while the content sits within the standard `px-5 md:px-10` gutter (20px on
 * mobile, 40px on desktop), matching the wireframe rule that only the section rules reach
 * the rail's edges.
 * @param props - Band content, optional inner classes, and whether to draw the bottom hairline
 * @returns The band section
 */
export const Band: React.FC<BandProps> = ({ children, className, divider = true }) => (
  <section className={divider ? 'border-b border-line-2' : ''}>
    <div className={`px-5 md:px-10 ${className ?? ''}`}>{children}</div>
  </section>
);
