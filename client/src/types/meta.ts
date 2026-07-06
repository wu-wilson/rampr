/** Response shape of `GET /api/meta`: the site-wide last-updated stamp for the nav. */
export interface Meta {
  /** MAX(snapshot_date) as an ISO date, or null before the first poll (day zero). */
  updatedAt: string | null;
}
