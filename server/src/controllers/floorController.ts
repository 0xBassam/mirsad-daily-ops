import { Request, Response } from 'express';
import { Floor } from '../models/Floor';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';

export const getFloors = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = {};
  if (req.query.building) filter.building = req.query.building;
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;

  const [data, total] = await Promise.all([
    Floor.find(filter).populate('building', 'name').populate('project', 'name').skip(skip).limit(limit).sort({ name: 1 }),
    Floor.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const getFloor = asyncHandler(async (req: Request, res: Response) => {
  const data = await Floor.findById(req.params.id).populate('building', 'name').populate('project', 'name');
  if (!data) throw new AppError('Floor not found', 404);
  res.json({ success: true, data });
});

export const createFloor = asyncHandler(async (req: Request, res: Response) => {
  const data = await Floor.create(req.body);
  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'floor', entityId: data._id, req });
  res.status(201).json({ success: true, data });
});

export const updateFloor = asyncHandler(async (req: Request, res: Response) => {
  const data = await Floor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!data) throw new AppError('Floor not found', 404);
  await logAction({ userId: req.user?.userId, action: 'update', entityType: 'floor', entityId: req.params.id, req });
  res.json({ success: true, data });
});

export const deleteFloor = asyncHandler(async (req: Request, res: Response) => {
  const data = await Floor.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
  if (!data) throw new AppError('Floor not found', 404);
  await logAction({ userId: req.user?.userId, action: 'delete', entityType: 'floor', entityId: req.params.id, req });
  res.json({ success: true, data });
});
