import { DatabaseUnavailableError } from './db';

import { config } from '../config';

/** Most bodies stored at once; past it the least recently used go first. */
const MAX_ENTRIES = 500;
/** Most bytes of bodies stored at once. */
const MAX_BYTES = 8 * 1024 * 1024;
/** A body larger than this is sent but never stored. */
const MAX_ENTRY_BYTES = 256 * 1024;
/** How old a stored body may be and still stand in for a response while the database is unreachable. */
const STALE_IF_ERROR_MS = 15 * 60 * 1000;
/** How long a stored body stays fresh; zero turns the cache off. */
const TTL_MS = config.cacheTtlSeconds * 1000;
/** The `Cache-Control` for anything a browser must not reuse. */
const NO_STORE = 'no-store';

/** A stored response body. */
interface Entry {
  /** The serialized JSON. */
  body: string;
  /** Size in bytes, counted against `MAX_BYTES`. */
  size: number;
  /** `Date.now()` when the body was built. */
  builtAt: number;
}

/** A response body ready to send. */
interface CachedJson {
  /** The serialized JSON. */
  body: string;
  /** The `Cache-Control` header to send it under. */
  cacheControl: string;
}

/** Stored bodies by key, least recently used first: a hit moves its key to the end. */
const entries = new Map<string, Entry>();
/** Builds in flight by key, which simultaneous requests for an expired entry share. */
const pending = new Map<string, Promise<Entry | null>>();
let totalBytes = 0;

/** The `Cache-Control` for a fresh body: public for the whole seconds it has left, so a browser copy never outlives this one. */
function freshFor(entry: Entry, now: number): string {
  return `public, max-age=${Math.floor((entry.builtAt + TTL_MS - now) / 1000)}`;
}

/** Drop a key's stored body, if any. */
function remove(key: string): void {
  const entry = entries.get(key);
  if (!entry) return;
  entries.delete(key);
  totalBytes -= entry.size;
}

/** Store a body as the most recently used, then evict the least recently used past the entry and byte caps. */
function store(key: string, entry: Entry): void {
  remove(key);
  if (entry.size > MAX_ENTRY_BYTES) return;
  entries.set(key, entry);
  totalBytes += entry.size;
  for (const [oldest] of entries) {
    if (entries.size <= MAX_ENTRIES && totalBytes <= MAX_BYTES) break;
    remove(oldest);
  }
}

/** Build a key's body once for every request waiting on it, storing it, or dropping the key when `load` finds nothing. */
function build(key: string, load: () => Promise<object | null>): Promise<Entry | null> {
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;

  const promise = load()
    .then((value) => {
      if (value === null) {
        remove(key);
        return null;
      }
      const body = JSON.stringify(value);
      const entry: Entry = { body, size: Buffer.byteLength(body), builtAt: Date.now() };
      store(key, entry);
      return entry;
    })
    .finally(() => {
      pending.delete(key);
    });
  pending.set(key, promise);
  return promise;
}

/**
 * Serve a key's JSON from memory while it is fresh, otherwise build and store it.
 * @param key - Built from validated input only, so a request can never add an entry of its own choosing
 * @param load - Builds the response; resolving `null` (an unknown company) is passed through and never stored
 * @returns The body and its `Cache-Control`, or `null` when `load` found nothing; while the database is unreachable, a stored body under 15 minutes old, sent `no-store`
 */
export function readThrough(key: string, load: () => Promise<object>): Promise<CachedJson>;
export function readThrough(key: string, load: () => Promise<object | null>): Promise<CachedJson | null>;
export async function readThrough(key: string, load: () => Promise<object | null>): Promise<CachedJson | null> {
  if (TTL_MS === 0) {
    const value = await load();
    return value === null ? null : { body: JSON.stringify(value), cacheControl: NO_STORE };
  }

  const now = Date.now();
  const stored = entries.get(key);
  if (stored && now - stored.builtAt < TTL_MS) {
    entries.delete(key);
    entries.set(key, stored);
    return { body: stored.body, cacheControl: freshFor(stored, now) };
  }

  try {
    const built = await build(key, load);
    return built === null ? null : { body: built.body, cacheControl: freshFor(built, Date.now()) };
  } catch (err) {
    if (!(err instanceof DatabaseUnavailableError) || !stored) throw err;
    const age = Date.now() - stored.builtAt;
    if (age >= STALE_IF_ERROR_MS) throw err;
    console.warn(`Database unavailable, serving ${key} from ${Math.floor(age / 1000)}s ago`);
    return { body: stored.body, cacheControl: NO_STORE };
  }
}
