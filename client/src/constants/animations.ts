/** Named duration constants in milliseconds. All in-flow motion stays at or below 300ms. */
export const DURATION = {
  fast: 150,
  normal: 250,
  smooth: 300,
} as const;

/** Shared easing curve for transforms and opacity transitions. */
export const EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)' as const;
