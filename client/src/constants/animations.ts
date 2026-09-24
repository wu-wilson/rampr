/** Interaction motion, in milliseconds. Everything a pointer or click triggers stays at or below 300ms. */
export const DURATION = {
  /** Hover colours, the range crossfade, the sliding tab underline. */
  normal: 200,
  /** Rows sliding to their new places after a sort. */
  smooth: 300,
} as const;

/**
 * Ambient motion, in milliseconds, which runs on its own clock or once as a section enters and
 * never in response to a pointer, so it may run longer than interaction motion.
 */
export const AMBIENT = {
  /** A chart line revealing left to right as its section enters. */
  draw: 700,
  /** One ledger rule brightening and settling during the wave. */
  wave: 1400,
  /** Delay between one rule starting and the next, top to bottom. */
  waveStagger: 100,
  /** Rest between the end of one wave and the start of the next. */
  waveGap: 1500,
  /** Delay before the first wave after the band appears. */
  waveLead: 1000,
} as const;

/** The one easing curve for interaction motion: a quick start that settles softly (Stripe's). */
export const EASING = 'cubic-bezier(0.25, 1, 0.5, 1)' as const;

/** A symmetric ease-in-out for motion that rises and returns, like the ledger wave. */
export const EASING_SYMMETRIC = 'cubic-bezier(0.45, 0, 0.55, 1)' as const;

/** The inline style every hover and toggle transition shares: `DURATION.normal` on `EASING`. */
export const TRANSITION = { transitionDuration: `${DURATION.normal}ms`, transitionTimingFunction: EASING } as const;
