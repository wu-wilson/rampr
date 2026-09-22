import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

import { prefersReducedMotion } from '../lib/motion';

import { DURATION, EASING } from '../constants/animations';

/** Delay (ms) before an entering row starts to fade in, so it lands after its neighbours move. */
const ENTER_DELAY = 100;

/**
 * Slide rows to their new places after a sort or filter, fading in rows that just appeared.
 * Children are matched by their `data-key` attribute inside a `position: relative` container.
 * @param containerRef - The element whose keyed children reorder
 */
export function useFlipReorder<T extends HTMLElement>(containerRef: RefObject<T>): void {
  const previous = useRef<Map<string, number> | null>(null);
  const settle = useRef<number | null>(null);

  // Clear a pending settle on unmount only; a re-render mid-slide must not cancel it, or the
  // transition styles would stay on the rows.
  useEffect(() => () => {
    if (settle.current !== null) window.clearTimeout(settle.current);
  }, []);

  // FLIP: record each row's offset on every commit, and when one moved, invert it back to where
  // it was, force a reflow, then let the transform transition away.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-key]'));
    const next = new Map<string, number>();
    const moving: Array<{ row: HTMLElement; dy: number }> = [];
    const entering: HTMLElement[] = [];

    rows.forEach((row) => {
      const key = row.dataset.key ?? '';
      next.set(key, row.offsetTop);
      const before = previous.current?.get(key);
      if (before === undefined) entering.push(row);
      else if (before !== row.offsetTop) moving.push({ row, dy: before - row.offsetTop });
    });

    const firstCommit = previous.current === null;
    previous.current = next;
    if (firstCommit || prefersReducedMotion() || (moving.length === 0 && entering.length === 0)) return;
    if (settle.current !== null) window.clearTimeout(settle.current);

    moving.forEach(({ row, dy }) => {
      row.style.transition = 'none';
      row.style.transform = `translateY(${dy}px)`;
    });
    entering.forEach((row) => {
      row.style.transition = 'none';
      row.style.opacity = '0';
    });

    // Force a reflow so the inverted positions paint before the transition begins.
    void container.offsetHeight;

    const animated = [...moving.map((entry) => entry.row), ...entering];
    animated.forEach((row) => {
      row.style.transition = [
        `transform ${DURATION.smooth}ms ${EASING}`,
        `opacity ${DURATION.normal}ms ${EASING} ${ENTER_DELAY}ms`,
        `background-color ${DURATION.normal}ms ${EASING}`,
      ].join(', ');
      row.style.transform = '';
      row.style.opacity = '';
    });
    settle.current = window.setTimeout(() => {
      animated.forEach((row) => {
        row.style.transition = '';
      });
      settle.current = null;
    }, DURATION.smooth + ENTER_DELAY);
  });
}
