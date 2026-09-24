/** A sortable column of the company table. */
export type BoardSortKey = 'name' | 'open' | 'd7' | 'd30';

/** The active sort of the company table: a column and whether it runs ascending. */
export interface BoardSort {
  key: BoardSortKey;
  ascending: boolean;
}

/** Signed market-wide changes over the trailing windows; each null while gated or without a prior release. */
interface MarketChanges {
  day1: number | null;
  day7: number | null;
  day30: number | null;
  day90: number | null;
}

/** Market-wide summary shown in the Board lead. */
export interface MarketSummary {
  totalOpen: number;
  companyCount: number;
  changes: MarketChanges;
  /** Boards with open roles and at least `GATING_DAYS` releases whose count today equals or beats every release in the last 90 days, or null when gated. */
  atHigh90: number | null;
  /** Share of all open roles held by the ten largest boards, as an integer percent. */
  topTenShare: number;
}

/** One ranked company row in the company table. */
export interface BoardCompany {
  rank: number;
  slug: string;
  name: string;
  /** Sector slug, e.g. `fintech`. */
  sector: string;
  /** Human-readable sector label, e.g. `Fintech`. */
  sectorLabel: string;
  open: number;
  /** Signed 7-day change in open roles, or null when gated or without a release that old. */
  delta7d: number | null;
  /** Signed 30-day change in open roles, or null when gated or without a release that old. */
  delta30d: number | null;
}

/** Response shape of `GET /api/board`. */
export interface BoardResponse {
  market: MarketSummary;
  companies: BoardCompany[];
  /** MAX(snapshot_date) as an ISO date, or null before the first release (day zero). */
  updatedAt: string | null;
}
