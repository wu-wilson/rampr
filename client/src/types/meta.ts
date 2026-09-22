/** Tracked boards per ATS provider. */
interface SourceCounts {
  greenhouse: number;
  lever: number;
  ashby: number;
}

/** Response shape of `GET /api/meta`: the release stamp for the masthead and the facts the Method page cites. */
export interface Meta {
  /** MAX(snapshot_date) as an ISO date, or null before the first release (day zero). */
  updatedAt: string | null;
  /** The latest release's number: days since tracking began plus one, so it survives retention and a missed morning; null on day zero. */
  releaseNumber: number | null;
  /** ISO date the series began (the earliest tracked-since), or null with no companies seeded. */
  firstRelease: string | null;
  companyCount: number;
  sources: SourceCounts;
}
