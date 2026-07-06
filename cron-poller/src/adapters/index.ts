import { ashbyAdapter } from './ashby';
import { greenhouseAdapter } from './greenhouse';
import { leverAdapter } from './lever';
import type { Adapter } from './types';

/** Supported ATS providers — mirrors the `companies.ats_provider` check. */
export type AtsProvider = 'greenhouse' | 'lever' | 'ashby';

/** Registry mapping each `ats_provider` to its adapter. */
export const adapters: Record<AtsProvider, Adapter> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  ashby: ashbyAdapter,
};

export type { Adapter, NormalizedListing, RemoteType } from './types';
