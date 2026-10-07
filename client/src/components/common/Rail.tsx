import React from 'react';

interface RailProps {
  children: React.ReactNode;
  /** Extra classes for the rail (vertical spacing, layout). */
  className?: string;
}

/**
 * The centred 1200px content rail with the page gutter, widened to clear the notch on a phone held sideways.
 * @param props - The rail content and extra classes
 * @returns The rail
 */
export const Rail: React.FC<RailProps> = ({ children, className }) => (
  <div
    className={`mx-auto w-full max-w-rail pl-[max(20px,env(safe-area-inset-left))] pr-[max(20px,env(safe-area-inset-right))]
      md:pl-[max(24px,env(safe-area-inset-left))] md:pr-[max(24px,env(safe-area-inset-right))] ${className ?? ''}`}
  >
    {children}
  </div>
);
