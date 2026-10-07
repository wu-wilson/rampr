import { z } from 'zod';

import { cleanDepartment, inferRemoteType } from '../normalize';
import { fetchJson } from './fetchJson';

import type { NativeRemoteFlag } from '../normalize';
import type { Adapter, NormalizedListing } from './types';

/** Defensive schema for a single Lever posting (`mode=json`). */
const leverPostingSchema = z.object({
  id: z.string(),
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

/** Map Lever's native `workplaceType` to a normalized work-mix flag: `remote` → remote, `hybrid` → hybrid, `on-site`/`onsite` → onsite; anything else yields null so the caller falls back to location inference. */
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
 * Fetch and normalize a Lever site, preferring its native `workplaceType` for the work mix.
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
