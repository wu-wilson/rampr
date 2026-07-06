import { z } from 'zod';

import { fetchJson } from './fetchJson';
import { cleanDepartment, inferRemoteType, type NativeRemoteFlag } from '../normalize';
import type { Adapter, NormalizedListing } from './types';

/** Defensive schema for a single Lever posting (`mode=json`). */
const leverPostingSchema = z.object({
  id: z.string(),
  text: z.string().nullish(),
  categories: z
    .object({
      department: z.string().nullish(),
      team: z.string().nullish(),
      location: z.string().nullish(),
    })
    .nullish(),
  workplaceType: z.string().nullish(),
});

/** Lever returns a top-level array of postings. */
const leverSchema = z.array(leverPostingSchema);

/**
 * Map Lever's native `workplaceType` to a normalized work-mix flag: `remote` → remote,
 * `hybrid` → hybrid, `on-site`/`onsite` → onsite; anything else yields null so the caller
 * falls back to location inference.
 * @param workplaceType - The posting's `workplaceType`, or null/undefined when absent
 * @returns The normalized native flag, or null when Lever gives no usable signal
 */
function mapWorkplaceType(workplaceType: string | null | undefined): NativeRemoteFlag {
  switch ((workplaceType ?? '').trim().toLowerCase()) {
    case 'remote':
      return 'remote';
    case 'hybrid':
      return 'hybrid';
    case 'on-site':
    case 'onsite':
      return 'onsite';
    default:
      return null;
  }
}

/**
 * Fetch and normalize a Lever site. Department prefers `categories.department`, falling
 * back to `categories.team`; the work mix prefers the native `workplaceType` and infers
 * from location only when the native flag is absent.
 * @param boardToken - The Lever site slug
 * @returns Normalized listings for the site
 */
export const leverAdapter: Adapter = async (boardToken: string): Promise<NormalizedListing[]> => {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(boardToken)}?mode=json`;
  const raw = await fetchJson(url);
  const parsed = leverSchema.parse(raw);

  return parsed.map((posting) => {
    const location = posting.categories?.location ?? null;
    return {
      externalId: posting.id,
      department:
        cleanDepartment(posting.categories?.department) ??
        cleanDepartment(posting.categories?.team),
      location,
      remoteType: inferRemoteType(mapWorkplaceType(posting.workplaceType), location),
    };
  });
};
