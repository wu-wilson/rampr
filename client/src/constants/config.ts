/** Base URL of the rampr API; baked in at Vite build time. */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/** GitHub repository URL surfaced in the footer "source on GitHub" link. */
export const GITHUB_URL = 'https://github.com/wu-wilson/rampr';

/**
 * Daily snapshots required before a trend surface (trajectory, momentum, market index,
 * movers) unlocks. Keep in sync with the server's GATING_DAYS.
 */
export const GATING_DAYS = 14;

/** Leaderboard rows revealed per page (initial and per "load more"). */
export const PAGE_SIZE = 25;
