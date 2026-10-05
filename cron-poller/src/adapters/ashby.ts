import { z } from 'zod';

import { fetchJson } from './fetchJson';
import { cleanDepartment, inferRemoteType, type NativeRemoteFlag } from '../normalize';

import type { Adapter, NormalizedListing } from './types';

/** Defensive schema for the Ashby job-board payload. */
const ashbySchema = z.object({
  jobs: z.array(
    z.object({
      id: z.string(),
      department: z.string().nullish(),
      team: z.string().nullish(),
      location: z.string().nullish(),
      isRemote: z.boolean().nullish(),
    }),
  ),
});

/**
 * Fetch and normalize an Ashby job board, reading `isRemote` as remote.
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
      externalId: job.id,
      department: cleanDepartment(job.department) ?? cleanDepartment(job.team),
      location,
      remoteType: inferRemoteType(nativeFlag, location),
    };
  });
};
