import { Request, Response } from 'express';
import { Building } from '../models/Building';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';

export const getBuildings = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = { organization: orgId };
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;

  const [data, total] = await Promise.all([
    Building.find(filter).populate('project', 'name').skip(skip).limit(limit).sort({ createdAt: -1 }),
    Building.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const getBuilding = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await Building.findOne({ _id: req.params.id, organization: orgId }).populate('project', 'name');
  if (!data) throw new AppError('Building not found', 404);
  res.json({ success: true, data });
});

export const createBuilding = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await Building.create({ ...req.body, organization: orgId });
  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'building', entityId: data._id, req });
  res.status(201).json({ success: true, data });
});

export const updateBuilding = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await Building.findOneAndUpdate(
    { _id: req.params.id, organization: orgId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!data) throw new AppError('Building not found', 404);
  await logAction({ userId: req.user?.userId, action: 'update', entityType: 'building', entityId: req.params.id, req });
  res.json({ success: true, data });
});

export const deleteBuilding = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await Building.findOneAndUpdate(
    { _id: req.params.id, organization: orgId },
    { status: 'inactive' },
    { new: true }
  );
  if (!data) throw new AppError('Building not found', 404);
  await logAction({ userId: req.user?.userId, action: 'delete', entityType: 'building', entityId: req.params.id, req });
  res.json({ success: true, data });
});
