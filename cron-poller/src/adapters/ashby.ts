import { z } from 'zod';

import { fetchJson } from './fetchJson';
import { cleanDepartment, inferRemoteType, type NativeRemoteFlag } from '../normalize';
import type { Adapter, NormalizedListing } from './types';

/** Defensive schema for the Ashby job-board payload. */
const ashbySchema = z.object({
  jobs: z.array(
    z.object({
      id: z.string(),
      title: z.string().nullish(),
      department: z.string().nullish(),
      team: z.string().nullish(),
      location: z.string().nullish(),
      isRemote: z.boolean().nullish(),
    }),
  ),
});

/**
 * Fetch and normalize an Ashby job board. Department prefers `department`, falling back to
 * `team`; the work mix reads native `isRemote === true` as remote, otherwise it infers from
 * location. Ashby exposes no hybrid flag, so a non-remote located role resolves to onsite.
 * @param boardToken - The Ashby organization slug
 * @returns Normalized listings for the board
 */
export const ashbyAdapter: Adapter = async (boardToken: string): Promise<NormalizedListing[]> => {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardToken)}`;
  const raw = await fetchJson(url);
  const parsed = ashbySchema.parse(raw);

  return parsed.jobs.map((job) => {
    const location = job.location ?? null;
    const nativeFlag: NativeRemoteFlag = job.isRemote === true ? 'remote' : null;
    return {
      externalId: String(job.id),
      department: cleanDepartment(job.department) ?? cleanDepartment(job.team),
      location,
      remoteType: inferRemoteType(nativeFlag, location),
    };
  });
};
