import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = {};
  if (req.query.user) filter.user = req.query.user;
  if (req.query.action) filter.action = req.query.action;
  if (req.query.entityType) filter.entityType = req.query.entityType;
  if (req.query.dateFrom || req.query.dateTo) {
    filter.createdAt = {};
    if (req.query.dateFrom) (filter.createdAt as any).$gte = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) (filter.createdAt as any).$lte = new Date(req.query.dateTo as string);
  }

  const [data, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('user', 'fullName email role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    AuditLog.countDocuments(filter),
  ]);

  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});
