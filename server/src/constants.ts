/**
 * Minimum days of daily history required before trend surfaces (trajectory, market
 * index, movers, momentum) unlock — below this, those fields return `gated: true`.
 * Keep in sync with the client's copy of this constant.
 */
export const GATING_DAYS = 14;
