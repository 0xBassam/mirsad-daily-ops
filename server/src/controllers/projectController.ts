import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = { organization: orgId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

  const [data, total] = await Promise.all([
    Project.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Project.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await Project.findOne({ _id: req.params.id, organization: orgId });
  if (!data) throw new AppError('Project not found', 404);
  res.json({ success: true, data });
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await Project.create({ ...req.body, organization: orgId, createdBy: req.user?.userId });
  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'project', entityId: data._id, req });
  res.status(201).json({ success: true, data });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await Project.findOneAndUpdate(
    { _id: req.params.id, organization: orgId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!data) throw new AppError('Project not found', 404);
  await logAction({ userId: req.user?.userId, action: 'update', entityType: 'project', entityId: req.params.id, req });
  res.json({ success: true, data });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await Project.findOneAndUpdate(
    { _id: req.params.id, organization: orgId },
    { status: 'inactive' },
    { new: true }
  );
  if (!data) throw new AppError('Project not found', 404);
  await logAction({ userId: req.user?.userId, action: 'delete', entityType: 'project', entityId: req.params.id, req });
  res.json({ success: true, data });
});
