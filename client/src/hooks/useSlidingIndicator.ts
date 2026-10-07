import { useLayoutEffect, useState } from 'react';

import type { RefObject } from 'react';

/** The indicator's unscaled width (px); `scaleX` stretches it to the active tab. */
export const INDICATOR_BASE_WIDTH = 60;

/**
 * Measure the transform that slides a tab row's underline under its active tab.
 * @param containerRef - The row of tab buttons
 * @param active - The `data-tab` value of the active tab
 * @returns The indicator's `transform` value
 */
export function useSlidingIndicator<T extends HTMLElement>(containerRef: RefObject<T>, active: string): string {
  const [transform, setTransform] = useState('scaleX(0)');

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = (): void => {
      const tab = container.querySelector<HTMLElement>(`[data-tab="${active}"]`);
      if (!tab) return;
      const left = tab.getBoundingClientRect().left - container.getBoundingClientRect().left;
      setTransform(`translateX(${left}px) scaleX(${tab.getBoundingClientRect().width / INDICATOR_BASE_WIDTH})`);
    };

    let cancelled = false;
    measure();
    window.addEventListener('resize', measure);
    document.fonts.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
      window.removeEventListener('resize', measure);
    };
  }, [containerRef, active]);

  return transform;
}
