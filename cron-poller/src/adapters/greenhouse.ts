import { z } from 'zod';

import { cleanDepartment, inferRemoteType } from '../normalize';
import { fetchJson } from './fetchJson';

import type { Adapter, NormalizedListing } from './types';

/** Defensive schema for the Greenhouse `jobs?content=true` payload. */
const greenhouseSchema = z.object({
  jobs: z.array(
    z.object({
      id: z.number(),
      location: z.object({ name: z.string().nullish() }).nullish(),
      departments: z.array(z.object({ name: z.string().nullish() })).nullish(),
    }),
  ),
});

/** Pick the first meaningful department name from a job's inline `departments[]`, skipping Greenhouse's "No Department" placeholder and empty/whitespace names. */
function pickDepartment(
  departments: z.infer<typeof greenhouseSchema>['jobs'][number]['departments'],
): string | null {
  if (!departments) {
    return null;
  }
  for (const department of departments) {
    const name = cleanDepartment(department.name);
    if (name && name.toLowerCase() !== 'no department') {
      return name;
    }
  }
  return null;
}

/**
 * Fetch and normalize a Greenhouse board, inferring the work mix from location.
 * @param boardToken - The Greenhouse board token
 * @returns Normalized listings for the board
 */
export const greenhouseAdapter: Adapter = async (
  boardToken: string,
): Promise<NormalizedListing[]> => {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
    boardToken,
  )}/jobs?content=true`;
  const raw = await fetchJson(url);
  const parsed = greenhouseSchema.parse(raw);

  return parsed.jobs.map((job) => {
    const location = job.location?.name ?? null;
    return {
      externalId: String(job.id),
      department: pickDepartment(job.departments),
      location,
      remoteType: inferRemoteType(null, location),
    };
  });
};
