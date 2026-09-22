import { useLayoutEffect, useState, type RefObject } from 'react';

import { prefersReducedMotion } from '../lib/motion';

/**
 * Where a revealed section is in its life: `static` never animates (it was in view on mount, or
 * motion is reduced), `pending` waits below the fold, `shown` has entered and risen once.
 */
export type RevealPhase = 'static' | 'pending' | 'shown';

/** How far above the viewport's bottom edge a section must reach before it reveals. */
const ROOT_MARGIN = '0px 0px -8% 0px';

/**
 * Track whether a section should rise into view. Sections already in the viewport when they
 * mount stay `static`, so the first frame is complete; sections below the fold start `pending`
 * and flip to `shown` once, the first time they intersect the viewport.
 * @param ref - The section element
 * @returns The section's reveal phase
 */
export function useReveal<T extends HTMLElement>(ref: RefObject<T>): RevealPhase {
  const [phase, setPhase] = useState<RevealPhase>('static');

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;
    if (element.getBoundingClientRect().top <= window.innerHeight) return;

    setPhase('pending');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setPhase('shown');
          observer.disconnect();
        }
      },
      { rootMargin: ROOT_MARGIN },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return phase;
}
