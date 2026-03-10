import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AdminPayload {
  adminId: number;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

/**
 * Require a valid access token for all requests.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access token is required.' });
    return;
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AdminPayload;
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired access token.' });
  }
}

/**
 * Require a valid access token only for write operations (POST, PUT, PATCH, DELETE).
 * GET/HEAD/OPTIONS requests pass through without authentication.
 */
export function authenticateWrites(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const readMethods = ['GET', 'HEAD', 'OPTIONS'];

  if (readMethods.includes(req.method)) {
    return next();
  }

  return authenticate(req, res, next);
}
