import type { RemoteType } from './adapters/types';

/**
 * Normalized native workplace flags an ATS may expose. Greenhouse has none; Lever
 * exposes `workplaceType`; Ashby exposes a boolean `isRemote` (mapped to 'remote' or
 * left null). A null flag means "the feed gave no native signal — fall back to location".
 */
export type NativeRemoteFlag = 'remote' | 'hybrid' | 'onsite' | null;

/**
 * Infer a role's work mix from an optional native provider flag and its location string,
 * per the shared ats-feeds rules: a native flag wins; otherwise the location is matched
 * case-insensitively (`hybrid` → hybrid, `remote` → remote, any non-empty string →
 * onsite); an absent flag and empty location yield 'unknown'. Kept conservative so
 * 'unknown' stays an honest residual rather than a guess that skews the remote share.
 * @param nativeFlag - The provider's native workplace signal, or null when none is given
 * @param location - The role's location string, or null when the feed omitted it
 * @returns The inferred work mix classification
 */
export function inferRemoteType(
  nativeFlag: NativeRemoteFlag,
  location: string | null,
): RemoteType {
  if (nativeFlag) {
    return nativeFlag;
  }

  const normalized = (location ?? '').trim().toLowerCase();
  if (!normalized) {
    return 'unknown';
  }
  if (normalized.includes('hybrid')) {
    return 'hybrid';
  }
  if (normalized.includes('remote')) {
    return 'remote';
  }
  return 'onsite';
}

/**
 * Clean a raw department/team value: trim surrounding whitespace and coalesce an empty
 * or missing string to null, so breakdowns never accrue a blank department bucket.
 * @param raw - The raw department/team value from a feed, or null/undefined
 * @returns The trimmed department name, or null when absent or blank
 */
export function cleanDepartment(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}
