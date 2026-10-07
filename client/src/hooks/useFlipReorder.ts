import { useLayoutEffect, useRef } from 'react';

import { prefersReducedMotion } from '../lib/motion';

import { DURATION, EASING } from '../constants/animations';

import type { RefObject } from 'react';

/** Delay (ms) before an entering row starts to fade in, so it lands after its neighbours move. */
const ENTER_DELAY = 100;

/**
 * Slide keyed rows to their new places after a sort or filter, fading in rows that appear.
 * @param containerRef - The element whose keyed children reorder
 */
export function useFlipReorder<T extends HTMLElement>(containerRef: RefObject<T>): void {
  const previous = useRef<Map<string, number> | null>(null);

  // FLIP: record each row's offset on every commit, and animate a row that moved from where it was
  // back to where it now sits.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const before = previous.current;
    const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-key]'));
    previous.current = new Map(rows.map((row) => [row.dataset.key ?? '', row.offsetTop]));
    if (before === null || prefersReducedMotion()) return;

    rows.forEach((row) => {
      const was = before.get(row.dataset.key ?? '');
      if (was === undefined) {
        row.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURATION.normal, delay: ENTER_DELAY, easing: EASING, fill: 'backwards' });
      } else if (was !== row.offsetTop) {
        row.animate([{ transform: `translateY(${was - row.offsetTop}px)` }, { transform: 'none' }], { duration: DURATION.smooth, easing: EASING });
      }
    });
  });
}
