import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

/**
 * Global error-handling middleware.
 * Must have exactly 4 parameters so Express recognises it as an error handler.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── Multer errors (file too large, wrong type, etc.) ──
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ success: false, message: 'File too large. Maximum size is 2 MB.' });
      return;
    }
    res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    return;
  }

  // ── Known errors with a status code ──
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  // ── Unexpected errors ──
  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error('[Error]', err);
  res.status(500).json({ success: false, message });
}

/**
 * Custom application error with an HTTP status code.
 * Throw this from controllers/services to return a specific status.
 *
 * Example: throw new AppError(400, 'Plans array is required');
 */
export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}
