import { Request, Response, NextFunction } from 'express';
import { Organization } from '../models/Organization';
import { AppError } from '../utils/AppError';

export function requireFeature(flagName: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const orgId = req.organizationId;
    if (!orgId) return next(new AppError('Organization context required', 403));

    const org = await Organization.findById(orgId).select('featureFlags plan').lean();
    if (!org) return next(new AppError('Organization not found', 404));

    const flags = org.featureFlags as Map<string, boolean> | Record<string, boolean>;
    const value = flags instanceof Map ? flags.get(flagName) : (flags as Record<string, boolean>)[flagName];

    // Only block when flag is explicitly set to false. Missing flag defaults to enabled.
    if (value === false) {
      return next(new AppError(`Feature "${flagName}" is not available on your current plan`, 402));
    }
    next();
  };
}
