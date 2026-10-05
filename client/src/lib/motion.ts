/**
 * Whether the viewer prefers reduced motion, for the Web Animations paths CSS cannot reach.
 * @returns True when `prefers-reduced-motion: reduce` matches
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
