import React from 'react';

interface StepMarkProps {
  /** Extra classes for the svg (spacing, alignment). */
  className?: string;
}

/** Rendered width and height (px). */
const SIZE = 22;

/**
 * The Rampr mark: one step up, drawn as a single monoline stroke in `currentColor`, so it sits
 * at the weight and colour of the type beside it.
 * @param props - Extra classes
 * @returns The mark svg
 */
export const StepMark: React.FC<StepMarkProps> = ({ className }) => (
  <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path
      d="M3 17.5H10.5V6.5H21"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
