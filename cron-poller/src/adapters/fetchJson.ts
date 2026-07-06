import { config } from '../config';

/** Number of additional attempts after the first failed request. */
const MAX_RETRIES = 2;

/** Base backoff in milliseconds, doubled per retry. */
const BACKOFF_BASE_MS = 500;

/** Pause for the given number of milliseconds. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a public JSON endpoint with a descriptive User-Agent, an AbortController
 * timeout, and a couple of retries with exponential backoff. Non-2xx responses are
 * treated as retryable failures; a request that still fails after all retries throws
 * so the poller can isolate and count it per company.
 * @param url - The absolute URL to fetch
 * @returns The parsed JSON body as `unknown` (caller must Zod-validate it)
 */
export async function fetchJson(url: string): Promise<unknown> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': config.userAgent, Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      return (await response.json()) as unknown;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await delay(BACKOFF_BASE_MS * 2 ** attempt);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
