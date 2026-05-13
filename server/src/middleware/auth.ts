import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export interface AuthPayload {
  userId:         string;
  role:           string;
  email:          string;
  organizationId: string | null;
  plan:           string;
}

declare global {
  namespace Express {
    interface Request {
      user?:           AuthPayload;
      organizationId?: string | null;
    }
  }
}

export function verifyJWT(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    // Legacy tokens (pre-SaaS) won't have organizationId — default to null.
    // Phase 2 will enforce re-login for token upgrades.
    req.organizationId = payload.organizationId ?? null;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError('Not authenticated', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}

export function requireOrganization(req: Request, _res: Response, next: NextFunction): void {
  if (!req.organizationId) {
    return next(new AppError('Organization context required — please log in again', 403));
  }
  next();
}
