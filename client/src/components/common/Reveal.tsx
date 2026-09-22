import React, { createContext, useContext, useRef } from 'react';

import { useReveal, type RevealPhase } from '../../hooks/useReveal';

/** The enclosing section's reveal phase, so a chart inside can draw as the section enters. */
const RevealContext = createContext<RevealPhase>('static');

/**
 * Read the reveal phase of the nearest {@link Reveal} ancestor.
 * @returns The phase, or `static` outside any Reveal
 */
export function useRevealPhase(): RevealPhase {
  return useContext(RevealContext);
}

interface RevealProps {
  children: React.ReactNode;
  /** Classes for the section wrapper (spacing, layout). */
  className?: string;
}

/**
 * A section that rises 10px into place the first time it scrolls into view, never when already in
 * view on mount. Charts inside read the phase through context and draw as the section appears.
 * @param props - The section content and wrapper classes
 * @returns The wrapped section
 */
export const Reveal: React.FC<RevealProps> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const phase = useReveal(ref);
  const motion = phase === 'static' ? '' : phase === 'pending' ? 'reveal' : 'reveal is-in';

  return (
    <RevealContext.Provider value={phase}>
      <div ref={ref} className={`${motion} ${className ?? ''}`}>
        {children}
      </div>
    </RevealContext.Provider>
  );
};
