/** Market-wide totals atop the Market screen. */
interface MarketTotals {
  totalOpen: number;
  /** MAX(snapshot_date) as an ISO date, or null before the first release (day zero). */
  updatedAt: string | null;
}

/** One sector's open-role total and share of the leading sector. */
export interface SectorTotal {
  slug: string;
  label: string;
  open: number;
  /** Share relative to the largest sector (0..100), for bar geometry. */
  pct: number;
  /** Signed 7-day change across the sector, or null while gated or when no board in it has a change yet. */
  delta7d: number | null;
}

/** One daily point on the market hiring index. */
interface IndexPoint {
  /** ISO snapshot date. */
  date: string;
  totalOpen: number;
}

/** The market index series: the last 90 days of daily totals, or none while `gated`. */
export interface MarketIndex {
  gated: boolean;
  daysTracked: number;
  points: IndexPoint[];
}

/** One release's breadth: boards that added postings versus boards that removed them. */
export interface BreadthPoint {
  /** ISO snapshot date. */
  date: string;
  rising: number;
  falling: number;
}

/** The breadth series, sharing the index's gate and empty while gated. */
interface Breadth {
  points: BreadthPoint[];
}

/** One mover: a company and its signed 7-day change. */
export interface Mover {
  slug: string;
  name: string;
  sectorLabel: string;
  delta: number;
}

/** The largest rises and falls, or a gated placeholder. */
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
  breadth: Breadth;
  movers: Movers;
}
