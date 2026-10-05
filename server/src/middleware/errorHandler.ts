import type { NextFunction, Request, Response } from 'express';

/**
 * The tail error handler, which echoes `err.message` only when the error is marked `isPublic`.
 * @param err - The error; a numeric `status` or `statusCode` sets the response code (default 500)
 * @param _req - Express request (unused but required by the 4-arg signature)
 * @param res - Express response, written with the resolved status and `{ error }` body
 * @param _next - Express next (unused but required by the 4-arg signature)
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('Error:', err);

  const raw = ('status' in err ? err.status : undefined) ?? ('statusCode' in err ? err.statusCode : undefined);
  const status = typeof raw === 'number' && Number.isInteger(raw) && raw >= 400 && raw <= 599 ? raw : 500;
  const isPublic = 'isPublic' in err && err.isPublic === true;
  const message = isPublic && err.message ? err.message : status < 500 ? 'Bad request' : 'Internal server error';

  res.status(status).json({ error: message });
}
