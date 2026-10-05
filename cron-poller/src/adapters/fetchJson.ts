import { config } from '../config';

/** Number of additional attempts after the first failed request. */
const MAX_RETRIES = 2;

/** Base backoff in milliseconds, doubled per retry. */
const BACKOFF_BASE_MS = 500;

/**
 * Pause for a number of milliseconds.
 * @param ms - How long to wait
 * @returns Resolves after the pause
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a public JSON endpoint with a User-Agent, a timeout, and exponential-backoff retries on any failure.
 * @param url - The absolute URL to fetch
 * @returns The parsed body as `unknown` for the caller to validate; rejects once the last retry fails
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
      return await response.json();
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
