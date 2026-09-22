import type { NextFunction, Request, Response } from 'express';

/**
 * Log one line per request once its response is sent: method, path, status, and duration. Paths
 * only, never query strings, bodies, or headers.
 * @param req - The incoming request
 * @param res - The response, logged when it finishes
 * @param next - Passes control to the next middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const started = Date.now();
  // Read the path now: a mounted router strips its prefix from `req.url` while it dispatches.
  const { method, path } = req;
  res.on('finish', () => {
    console.log(`${method} ${path} ${res.statusCode} ${Date.now() - started}ms`);
  });
  next();
}
