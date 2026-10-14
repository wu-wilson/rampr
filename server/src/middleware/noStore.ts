import type { NextFunction, Request, Response } from 'express';

/**
 * Mark an API response `no-store` until a cached read sets its own `Cache-Control`, so no browser reuses an error.
 * @param _req - Express request (unused)
 * @param res - The response, given the default header
 * @param next - Passes control to the next middleware
 */
export function noStore(_req: Request, res: Response, next: NextFunction): void {
  res.set('Cache-Control', 'no-store');
  next();
}
