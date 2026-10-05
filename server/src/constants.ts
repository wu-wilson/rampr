/** Releases a trend surface needs before it unlocks (keep in sync with the client's `GATING_DAYS`). */
export const GATING_DAYS = 14;

/** Days each trend window counts back from the latest release (keep in sync with the client and the cleanup). */
export const TREND_WINDOW_DAYS = 90;
