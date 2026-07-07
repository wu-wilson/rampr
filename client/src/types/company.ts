import type { Momentum } from './common';

/** ATS provider a company's roles are polled from. */
type AtsSource = 'greenhouse' | 'lever' | 'ashby';

/** Identity and placement of a company on the board. */
interface CompanyInfo {
  slug: string;
  name: string;
  sector: string;
  sectorLabel: string;
  rank: number;
  /** ISO date tracking began for this company. */
  trackedSince: string;
  /** The company's own public careers/board URL, or null when unknown. */
  careersUrl: string | null;
  source: AtsSource;
}

/** One department breakdown row. */
export interface DeptCount {
  name: string;
  count: number;
}

/** One location breakdown row. */
export interface LocationCount {
  name: string;
  count: number;
}

/** A single share of the work-mix bar. */
export interface WorkMixSlice {
  /** Whole-number percent of open roles. */
  pct: number;
  count: number;
}

/** Remote / hybrid / onsite / unknown split of a company's open roles. */
export interface WorkMix {
  remote: WorkMixSlice;
  hybrid: WorkMixSlice;
  onsite: WorkMixSlice;
  /** Residual bucket; rendered only when its count is greater than zero. */
  unknown: WorkMixSlice;
}

/** Live breakdowns over the company's currently-open roles. */
interface Breakdowns {
  departments: DeptCount[];
  locations: LocationCount[];
  workMix: WorkMix;
}

/** One daily point on the trajectory chart. */
export interface TrajectoryPoint {
  /** ISO snapshot date. */
  date: string;
  count: number;
}

/**
 * The company's open-count time series. `points` is empty and `gated` is true until
 * 14 daily snapshots exist; otherwise up to 90 days of daily points.
 */
export interface Trajectory {
  gated: boolean;
  daysTracked: number;
  points: TrajectoryPoint[];
}

/** Response shape of `GET /api/companies/:slug`. */
export interface CompanyResponse {
  company: CompanyInfo;
  open: number;
  momentum: Momentum;
  breakdowns: Breakdowns;
  trajectory: Trajectory;
}
