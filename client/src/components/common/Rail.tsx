import React from 'react';

interface RailProps {
  children: React.ReactNode;
  /** Extra classes for the rail (vertical spacing, layout). */
  className?: string;
}

/**
 * The centred 1200px content rail with the page gutter.
 * @param props - The rail content and extra classes
 * @returns The rail
 */
export const Rail: React.FC<RailProps> = ({ children, className }) => (
  <div className={`mx-auto w-full max-w-rail px-5 md:px-6 ${className ?? ''}`}>{children}</div>
);
