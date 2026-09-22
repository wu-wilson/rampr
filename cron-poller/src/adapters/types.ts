/** Work-mix classification for a role, mirroring the `listings.remote_type` check. */
export type RemoteType = 'remote' | 'hybrid' | 'onsite' | 'unknown';

/** A listing normalized to the shape the poller persists; the title is never kept, since rampr only counts roles. */
export interface NormalizedListing {
  /** Provider-stable ID, unique within a company's board (stringified). */
  externalId: string;
  /** Department/team, or null when absent. */
  department: string | null;
  /** Location string, or null when absent. */
  location: string | null;
  /** Inferred work mix for the role; 'unknown' when the feed is inconclusive. */
  remoteType: RemoteType;
}

/** Fetches and normalizes one company's public ATS feed from its board token (greenhouse token / lever site / ashby org). */
export type Adapter = (boardToken: string) => Promise<NormalizedListing[]>;
