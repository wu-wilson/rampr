/** Direction of a company's 7-day open-count momentum. */
export type MomentumDirection = 'up' | 'down' | 'flat';

/**
 * A company's 7-day hiring momentum. `delta` is a signed integer (open now minus the
 * open count seven days ago); it is `null` while `gated` is true (fewer than
 * 14 daily snapshots exist yet).
 */
export interface Momentum {
  /** Signed 7-day change in open roles, or null when gated. */
  delta: number | null;
  direction: MomentumDirection;
  /** True until 14 daily snapshots have accrued for the company. */
  gated: boolean;
}
