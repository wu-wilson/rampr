/**
 * Minimum days of daily history required before trend surfaces (trajectory, changes, market
 * index, breadth, movers) unlock; below this they return `null` or `gated: true`. Keep in sync
 * with the client's copy of this constant.
 */
export const GATING_DAYS = 14;

/**
 * Depth (days, counting back from the latest release) of every trend window: the company and
 * market charts, breadth, and the high watermark. Matches the cleanup worker's retention, so
 * nothing a surface reads has been pruned. Keep in sync with the client's copy of this constant.
 */
export const TREND_WINDOW_DAYS = 90;
