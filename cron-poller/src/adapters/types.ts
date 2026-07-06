/** Work-mix classification for a role, mirroring the `listings.remote_type` check. */
export type RemoteType = 'remote' | 'hybrid' | 'onsite' | 'unknown';

/**
 * A single ATS listing normalized to the shape the poller persists. Every adapter
 * produces these regardless of provider; null marks a field the feed did not supply.
 * Title is intentionally omitted — rampr only counts and breaks down roles, never
 * stores the title.
 */
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

/**
 * Fetches and normalizes one company's public ATS feed.
 * @param boardToken - The company's `ats_id` (greenhouse token / lever site / ashby org)
 * @returns The company's current open listings, normalized
 */
export type Adapter = (boardToken: string) => Promise<NormalizedListing[]>;
