import type { NextFunction, Request, Response } from 'express';

/**
 * The app's single tail error handler: a numeric `.status` on the error sets the response code
 * (default 500), and `err.message` reaches the client only when `.isPublic` is true; any other
 * error reads as a generic bad request or server error by status.
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
  const raw = typed.status ?? typed.statusCode;
  const status = Number.isInteger(raw) && raw! >= 400 && raw! <= 599 ? raw! : 500;
  const message = typed.isPublic && err.message ? err.message : status < 500 ? 'Bad request' : 'Internal server error';

  res.status(status).json({ error: message });
}
