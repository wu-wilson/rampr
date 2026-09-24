/** Base URL of the rampr API; baked in at Vite build time. */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/** GitHub repository URL surfaced in the footer link. */
export const GITHUB_URL = 'https://github.com/wu-wilson/rampr';

/**
 * Daily snapshots required before a trend surface (trajectory, changes, market index,
 * breadth, movers) unlocks. Keep in sync with the server's GATING_DAYS.
 */
export const GATING_DAYS = 14;

/** Hour (UTC) of the daily release, as the poller schedules it. */
export const RELEASE_HOUR_UTC = 8;

/**
 * Rows requested from `/api/board`: the whole board in one page, sorted and filtered locally.
 * Must stay at or below the server's cap and above the seeded company count.
 */
export const BOARD_LIMIT = 250;

/** Rows the company table shows before "Show all" expands it. */
export const TABLE_PREVIEW_ROWS = 15;

/**
 * Days of history a series can hold, the server's window; a high or low is called 90-day only once a
 * series covers it. Keep in sync with the server's TREND_WINDOW_DAYS.
 */
export const SERIES_DAYS = 90;

/** Releases the hero chart plots (the tail of the market index). */
export const HERO_RELEASES = 30;

/** Releases the breadth chart plots on phones, where 90 bars would be too thin to read. */
export const NARROW_BREADTH_RELEASES = 30;

/** Viewports below Tailwind's `sm` screen (560px), where the breadth chart shortens its window. */
export const PHONE_QUERY = '(max-width: 559px)';

/** Releases listed in the company page's daily table. */
export const DAILY_TABLE_ROWS = 7;

/** Breakdown rows shown before "See all" expands a column. */
export const BREAKDOWN_PREVIEW_ROWS = 6;

/** Spacing (px) between the ledger rules behind the hero; panel edges snap to it. */
export const RULE_SPACING = 48;
