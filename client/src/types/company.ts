/** ATS provider a company's roles are polled from. */
type AtsSource = 'greenhouse' | 'lever' | 'ashby';

/** Identity and placement of a company on the board. */
interface CompanyInfo {
  name: string;
  sectorLabel: string;
  rank: number;
  /** Companies tracked in all, the denominator for `rank`. */
  companyCount: number;
  /** Position by open-role count within the sector (1 = most). */
  sectorRank: number;
  /** Companies tracked in the same sector. */
  sectorCompanyCount: number;
  /** Live open roles across the whole sector, for the share figure. */
  sectorOpen: number;
  /** ISO date tracking began for this company. */
  trackedSince: string;
  /** The company's own public careers/board URL, or null when unknown. */
  careersUrl: string | null;
  source: AtsSource;
}

/** One department or location breakdown row. */
export interface BreakdownEntry {
  name: string;
  count: number;
}

/** A single share of the work arrangement split. */
interface WorkMixSlice {
  /** Whole-number percent of open roles. */
  pct: number;
  count: number;
}

/** Remote / hybrid / onsite / unknown split of a company's open roles. */
interface WorkMix {
  remote: WorkMixSlice;
  hybrid: WorkMixSlice;
  onsite: WorkMixSlice;
  /** Residual bucket for postings that state no arrangement. */
  unknown: WorkMixSlice;
}

/** Live breakdowns over the company's currently-open roles. */
export interface Breakdowns {
  departments: BreakdownEntry[];
  locations: BreakdownEntry[];
  workMix: WorkMix;
}

/** One daily point on the trajectory chart. */
interface TrajectoryPoint {
  /** ISO snapshot date. */
  date: string;
  count: number;
}

/** The company's open-count series: the last 90 days of points, or none while `gated`. */
export interface Trajectory {
  gated: boolean;
  daysTracked: number;
  points: TrajectoryPoint[];
}

/** Response shape of `GET /api/companies/:slug`. */
export interface CompanyResponse {
  company: CompanyInfo;
  open: number;
  /** Signed 7-day change in open roles, or null when gated or without a release that old. */
  delta7d: number | null;
  breakdowns: Breakdowns;
  trajectory: Trajectory;
}
