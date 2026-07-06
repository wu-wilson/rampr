/** Response shape of `GET /api/meta`: market-wide counters and poll history. */
export interface Meta {
  totalOpen: number;
  companyCount: number;
  sectorCount: number;
  /** MAX(snapshot_date) as an ISO date, or null before the first poll (day zero). */
  updatedAt: string | null;
  /** True until 14 distinct snapshot dates exist globally. */
  gated: boolean;
  /** Count of distinct snapshot dates recorded so far. */
  daysOfHistory: number;
  /** Display names of the ATS providers polled, e.g. `["Greenhouse", "Lever", "Ashby"]`. */
  sources: string[];
}
