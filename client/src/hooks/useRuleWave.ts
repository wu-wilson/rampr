import { useEffect, type RefObject } from 'react';

import { prefersReducedMotion } from '../lib/motion';

import { AMBIENT, EASING_SYMMETRIC } from '../constants/animations';

/**
 * Run the ledger wave: a darkening that passes down the rules behind the hero, rests, then passes
 * again, skipped under reduced motion and while the tab is hidden.
 * @param ref - The element holding the rule overlays, each marked `data-rule`
 * @param count - How many rules there are (restarts the clock when it changes)
 */
export function useRuleWave<T extends HTMLElement>(ref: RefObject<T>, count: number): void {
  useEffect(() => {
    if (count === 0 || prefersReducedMotion()) return;

    let timer = 0;
    const pass = (): void => {
      const overlays = ref.current?.querySelectorAll<HTMLElement>('[data-rule]');
      if (overlays && !document.hidden) {
        overlays.forEach((overlay, index) => {
          overlay.animate([{ opacity: 0 }, { opacity: 1, offset: 0.33 }, { opacity: 1, offset: 0.67 }, { opacity: 0 }], {
            duration: AMBIENT.wave,
            delay: index * AMBIENT.waveStagger,
            easing: EASING_SYMMETRIC,
          });
        });
      }
      const length = AMBIENT.wave + Math.max(0, count - 1) * AMBIENT.waveStagger;
      timer = window.setTimeout(pass, length + AMBIENT.waveGap);
    };

    timer = window.setTimeout(pass, AMBIENT.waveLead);
    return () => window.clearTimeout(timer);
  }, [ref, count]);
}
