import { useLayoutEffect, type RefObject } from 'react';

import { RULE_CLEARANCE, RULE_SPACING } from '../constants/config';

/** The smallest odd whole number at or above a height, so a block centres in a rule span on whole pixels. */
function oddCeil(height: number): number {
  const whole = Math.ceil(height);
  return whole % 2 === 1 ? whole : whole + 1;
}

/** The smallest `RULE_SPACING × k + 1` at or above a height: a span whose first and last pixels both sit on rules. */
function ruleSpan(height: number): number {
  return Math.ceil((height - 1) / RULE_SPACING) * RULE_SPACING + 1;
}

/**
 * Keep every hero panel edge off the ledger rules by growing the band, and stacked panels, to whole rule spans.
 * @param bandRef - The full-bleed band the rules are drawn on, a flex column that centres the panels
 * @param leadRef - The lead panel
 * @param chartRef - The chart panel
 */
export function useSnapToRules(
  bandRef: RefObject<HTMLElement>,
  leadRef: RefObject<HTMLElement>,
  chartRef: RefObject<HTMLElement>,
): void {
  useLayoutEffect(() => {
    const band = bandRef.current;
    const lead = leadRef.current;
    const chart = chartRef.current;
    if (!band || !lead || !chart) return;

    const snap = (): void => {
      // Measure both panels at their own heights, unstretched by the grid row.
      lead.style.minHeight = '';
      chart.style.minHeight = '';
      lead.style.alignSelf = 'start';
      chart.style.alignSelf = 'start';
      const leadBox = lead.getBoundingClientRect();
      const chartBox = chart.getBoundingClientRect();
      lead.style.alignSelf = '';
      chart.style.alignSelf = '';

      if (chartBox.top < leadBox.bottom) {
        // Side by side: the row takes the taller panel's height and the grid stretches the other to it.
        lead.style.minHeight = `${oddCeil(Math.max(leadBox.height, chartBox.height))}px`;
      } else {
        lead.style.minHeight = `${ruleSpan(leadBox.height)}px`;
        chart.style.minHeight = `${ruleSpan(chartBox.height)}px`;
      }

      const top = lead.getBoundingClientRect().top;
      const bottom = Math.max(lead.getBoundingClientRect().bottom, chart.getBoundingClientRect().bottom);
      const block = Math.round(bottom - top);
      band.style.minHeight = `${ruleSpan(block + 2 * (RULE_SPACING + RULE_CLEARANCE))}px`;
    };

    let cancelled = false;
    snap();
    const observer = new ResizeObserver(snap);
    observer.observe(lead);
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
  }, [bandRef, leadRef, chartRef]);
}
