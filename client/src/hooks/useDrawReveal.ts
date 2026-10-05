import { useEffect, useRef, type RefObject } from 'react';

import { prefersReducedMotion } from '../lib/motion';

import { AMBIENT, EASING } from '../constants/animations';

import type { RevealPhase } from './useReveal';

/**
 * Draw a chart line left to right as its section first enters view.
 * @param pathRef - The line's `path` element
 * @param phase - The enclosing section's reveal phase
 */
export function useDrawReveal(pathRef: RefObject<SVGPathElement>, phase: RevealPhase): void {
  const previous = useRef<RevealPhase>(phase);

  useEffect(() => {
    const path = pathRef.current;
    const armed = previous.current === 'pending' && phase === 'shown';
    previous.current = phase;
    if (!armed || !path || prefersReducedMotion()) return;

    // Inset order is top, right, bottom, left: the right inset travels for a left-to-right reveal.
    const animation = path.animate(
      [{ clipPath: 'inset(-6px 100% -6px -6px)' }, { clipPath: 'inset(-6px -6px -6px -6px)' }],
      { duration: AMBIENT.draw, easing: EASING, fill: 'forwards' },
    );
    animation.onfinish = () => animation.cancel();
    return () => animation.cancel();
  }, [pathRef, phase]);
}
