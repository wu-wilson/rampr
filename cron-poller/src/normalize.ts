import type { RemoteType } from './adapters/types';

/** A feed's own workplace signal (Lever's `workplaceType`, Ashby's `isRemote`), or null to fall back to the location. */
export type NativeRemoteFlag = 'remote' | 'hybrid' | 'onsite' | null;

/**
 * Classify a role's work mix: a native flag wins, else the location string, else `unknown`.
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
 * Trim a raw department or team name, coalescing a blank or missing one to null.
 * @param raw - The raw department/team value from a feed, or null/undefined
 * @returns The trimmed department name, or null when absent or blank
 */
export function cleanDepartment(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}
