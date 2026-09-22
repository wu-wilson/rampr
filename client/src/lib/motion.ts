/**
 * Whether the viewer has asked for reduced motion. Checked by the Web Animations code paths,
 * which the CSS media query cannot reach.
 * @returns True when `prefers-reduced-motion: reduce` matches
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
