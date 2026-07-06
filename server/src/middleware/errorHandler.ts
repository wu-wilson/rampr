import { Request, Response, NextFunction } from 'express';

/**
 * Express error-handling middleware — the single tail handler for the app.
 * A numeric `.status`/`.statusCode` on the error becomes the response code (default 500). The raw `err.message`
 * is only echoed to the client when `.isPublic === true`; everything else is genericized to "Internal server error"
 * so raw pg wording never leaks. The full error (including stack) is logged server-side and never
 * returned to the client.
 * @param err - Error thrown or passed via `next(err)`; may carry `.status`/`.statusCode` and `.isPublic`
 * @param _req - Express request (unused but required by the 4-arg signature)
 * @param res - Express response, written with the resolved status + body
 * @param _next - Express next (unused but required by the 4-arg signature)
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('Error:', err);

  const typed = err as Error & { status?: number; statusCode?: number; isPublic?: boolean };
  const status = typed.status || typed.statusCode || 500;
  const message = typed.isPublic && err.message ? err.message : 'Internal server error';

  res.status(status).json({ error: message });
}
