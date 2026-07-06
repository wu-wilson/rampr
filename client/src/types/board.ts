import type { Momentum } from './common';

/** Sort order applied to the leaderboard, mapped to the API `sort` query param. */
export type BoardSort = 'open' | 'momentum';

/** Market-wide summary shown as the Board headline. */
export interface MarketSummary {
  totalOpen: number;
  companyCount: number;
  sectorCount: number;
  /** True until 14 distinct snapshot dates exist globally; hides the 7-day delta. */
  gated: boolean;
  /** Signed 7-day change in total open roles, or null when gated. */
  delta7d: number | null;
}

/** One ranked company row in the leaderboard. */
export interface BoardCompany {
  rank: number;
  slug: string;
  name: string;
  /** Sector slug, e.g. `fintech`. */
  sector: string;
  /** Human-readable sector label, e.g. `Fintech`. */
  sectorLabel: string;
  open: number;
  /** Remote share as a whole-number percent (remote / total open, hybrid excluded). */
  remotePct: number;
  momentum: Momentum;
}

/** Response shape of `GET /api/board`. */
export interface BoardResponse {
  market: MarketSummary;
  companies: BoardCompany[];
  /** Count of companies matching the active filters, for load-more. */
  total: number;
  /** MAX(snapshot_date) as an ISO date, or null before the first poll (day zero). */
  updatedAt: string | null;
}
