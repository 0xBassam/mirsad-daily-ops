import { Request, Response } from 'express';
import { CorrectiveAction } from '../models/CorrectiveAction';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';

export const getCorrectiveActions = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = { organization: orgId };
  if (req.query.project)  filter.project  = req.query.project;
  if (req.query.status)   filter.status   = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;

  const [data, total] = await Promise.all([
    CorrectiveAction.find(filter)
      .populate('assignedTo', 'fullName')
      .populate('createdBy',  'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CorrectiveAction.countDocuments(filter),
  ]);

  res.json({ success: true, data, meta: paginationMeta(total, page, limit) });
});

export const getCorrectiveActionById = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const action = await CorrectiveAction.findOne({ _id: req.params.id, organization: orgId })
    .populate('assignedTo', 'fullName')
    .populate('createdBy',  'fullName')
    .lean();

  if (!action) throw new AppError('Corrective action not found', 404);
  res.json({ success: true, data: action });
});

export const createCorrectiveAction = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const userId = (req as any).user._id;
  const action = await CorrectiveAction.create({ ...req.body, organization: orgId, createdBy: userId, status: 'open' });
  await logAction({ userId: userId.toString(), action: 'create', entityType: 'corrective_action', entityId: action._id, req });
  res.status(201).json({ success: true, data: action });
});

export const updateCorrectiveAction = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const userId = (req as any).user._id;
  const action = await CorrectiveAction.findOne({ _id: req.params.id, organization: orgId });
  if (!action) throw new AppError('Corrective action not found', 404);

  const { status, resolution, ...rest } = req.body;

  if (status) {
    if (status === 'resolved') {
      if (!resolution?.trim()) throw new AppError('Resolution notes required when resolving', 400);
      action.resolution = resolution;
      action.resolvedAt = new Date();
    }
    if (status === 'closed' && action.status !== 'resolved') {
      throw new AppError('Action must be resolved before closing', 400);
    }
    action.status = status;
  }

  Object.assign(action, rest);
  await action.save();
  await logAction({ userId: userId.toString(), action: 'update', entityType: 'corrective_action', entityId: action._id, req });

  const populated = await CorrectiveAction.findOne({ _id: action._id, organization: orgId })
    .populate('assignedTo', 'fullName')
    .populate('createdBy',  'fullName')
    .lean();

  res.json({ success: true, data: populated });
});
