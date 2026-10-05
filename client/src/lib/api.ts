import { API_URL } from '../constants/config';

/** An HTTP-level failure from the rampr API, carrying the response status for 404 handling. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Fetch and parse JSON from a rampr API path, throwing an `ApiError` with the status on any non-2xx response.
 * @param path - API path beginning with `/api`, e.g. `/api/meta`
 * @returns The parsed JSON body typed as `T`
 */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new ApiError(response.status, `Request to ${path} failed (${response.status})`);
  }
  // The API contract fixes each endpoint's JSON shape; the single cast is centralized here.
  return (await response.json()) as T;
}

/**
 * Turn a thrown fetch or API error into a short reader-safe message, never a URL, status, or stack.
 * @param err - The value thrown by {@link apiGet} (usually an {@link ApiError}) or the fetch layer
 * @param fallback - A friendly, screen-specific default for otherwise-unclassified errors
 * @returns A user-facing message
 */
export function toUserMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 503) {
      return 'Temporarily unavailable. Try again shortly.';
    }
    if (err.status === 429) {
      return 'Too many requests. Give it a moment.';
    }
    return fallback;
  }
  return err instanceof TypeError ? 'Couldn’t reach Rampr. Check your connection.' : fallback;
}
