import type { RemoteType } from './adapters/types';

/** A feed's own workplace signal (Lever's `workplaceType`, Ashby's `isRemote`), or null to fall back to the location. */
export type NativeRemoteFlag = 'remote' | 'hybrid' | 'onsite' | null;

/**
 * Infer a role's work mix: a native provider flag wins, otherwise the location is matched
 * case-insensitively for `hybrid` or `remote` and any other non-empty string reads as onsite.
 * With neither signal the role stays 'unknown', so no guess skews the remote share.
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
