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
 * Fetch and parse a JSON payload from a rampr API path. Throws an {@link ApiError}
 * carrying the HTTP status on any non-2xx response so callers can distinguish a 404
 * (unknown company slug) from a transport failure.
 * @param path - API path beginning with `/api`, e.g. `/api/board?sort=open`
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
 * Turn a thrown fetch/api error into a short, non-technical message safe to show a general
 * reader — never a URL, status code, or stack. A transport failure reads as a connection
 * problem; a 503 as a brief data outage; anything else falls back to the caller's
 * screen-specific line.
 * @param err - The value thrown by {@link apiGet} (usually an {@link ApiError}) or the fetch layer
 * @param fallback - A friendly, screen-specific default for otherwise-unclassified errors
 * @returns A user-facing message
 */
export function toUserMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 503) {
      return 'Temporarily unavailable — try again shortly.';
    }
    return fallback;
  }
  return 'Couldn’t reach rampr — check your connection.';
}
