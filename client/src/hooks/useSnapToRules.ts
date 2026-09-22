import { useLayoutEffect, type RefObject } from 'react';

import { RULE_SPACING } from '../constants/config';

/** Pad a panel so its outer height is `RULE_SPACING × k + 1`: with the top border on a rule, the 1px bottom border then lands exactly on another. */
function snapHeight(panel: HTMLElement): void {
  panel.style.paddingTop = '';
  panel.style.paddingBottom = '';
  const style = getComputedStyle(panel);
  const paddingTop = parseFloat(style.paddingTop);
  const paddingBottom = parseFloat(style.paddingBottom);
  const height = panel.getBoundingClientRect().height;
  const target = Math.ceil((height - 1) / RULE_SPACING) * RULE_SPACING + 1;
  const extra = target - height;
  panel.style.paddingTop = `${paddingTop + Math.floor(extra / 2)}px`;
  panel.style.paddingBottom = `${paddingBottom + extra - Math.floor(extra / 2)}px`;
}

/**
 * Keep the hero's two panels on the ledger rules, padding each so its borders sit on rules and
 * nudging the chart panel when it sits beside the taller text panel.
 * @param bandRef - The full-bleed band the rules are drawn on
 * @param textRef - The left text panel
 * @param chartRef - The right chart panel
 */
export function useSnapToRules(
  bandRef: RefObject<HTMLElement>,
  textRef: RefObject<HTMLElement>,
  chartRef: RefObject<HTMLElement>,
): void {
  useLayoutEffect(() => {
    const band = bandRef.current;
    const text = textRef.current;
    const chart = chartRef.current;
    if (!band || !text || !chart) return;

    const snap = (): void => {
      snapHeight(text);
      snapHeight(chart);
      chart.style.marginTop = '';
      const sideBySide = chart.getBoundingClientRect().top < text.getBoundingClientRect().bottom;
      if (!sideBySide) return;
      const top = chart.getBoundingClientRect().top - band.getBoundingClientRect().top;
      const snapped = Math.round(top / RULE_SPACING) * RULE_SPACING;
      // A centred item moves by half the margin added to one side, so the nudge is doubled.
      chart.style.marginTop = `${(snapped - top) * 2}px`;
    };

    let cancelled = false;
    snap();
    const observer = new ResizeObserver(snap);
    observer.observe(text);
    observer.observe(chart);
    window.addEventListener('resize', snap);
    document.fonts.ready.then(() => {
      if (!cancelled) snap();
    });
    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener('resize', snap);
    };
  }, [bandRef, textRef, chartRef]);
}
