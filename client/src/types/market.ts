/** Market-wide totals shown atop the Market screen. */
export interface MarketTotals {
  totalOpen: number;
  companyCount: number;
  sectorCount: number;
  /** MAX(snapshot_date) as an ISO date, or null before the first poll (day zero). */
  updatedAt: string | null;
}

/** One sector's open-role total and share of the leading sector. */
export interface SectorTotal {
  slug: string;
  label: string;
  open: number;
  /** Share relative to the largest sector (0..100), for bar geometry. */
  pct: number;
}

/** One daily point on the market hiring index. */
export interface IndexPoint {
  /** ISO snapshot date. */
  date: string;
  totalOpen: number;
}

/**
 * The market hiring index time series. `points` is empty and `gated` is true until
 * 14 distinct snapshot dates exist; otherwise up to 90 days of daily totals.
 */
export interface MarketIndex {
  gated: boolean;
  daysTracked: number;
  points: IndexPoint[];
}

/** One heating/cooling mover: a company and its signed 7-day delta. */
export interface Mover {
  slug: string;
  name: string;
  delta: number;
}

/** Heating and cooling movers, or a gated placeholder. */
export interface Movers {
  gated: boolean;
  heating: Mover[];
  cooling: Mover[];
}

/** Response shape of `GET /api/market`. */
export interface MarketResponse {
  totals: MarketTotals;
  sectors: SectorTotal[];
  index: MarketIndex;
  movers: Movers;
}
