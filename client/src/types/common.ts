/** Direction of a company's 7-day open-count momentum. */
export type MomentumDirection = 'up' | 'down' | 'flat';

/**
 * A company's 7-day hiring momentum. `delta` is a signed integer (open now minus the
 * open count seven days ago); it is `null` while `gated` is true (fewer than
 * GATING_DAYS daily snapshots exist yet).
 */
export interface Momentum {
  /** Signed 7-day change in open roles, or null when gated. */
  delta: number | null;
  direction: MomentumDirection;
  /** True until GATING_DAYS daily snapshots have accrued for the company. */
  gated: boolean;
  /** Count of daily snapshots recorded so far for the company. */
  daysTracked: number;
}
