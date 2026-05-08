import { Request, Response } from 'express';
import { Item } from '../models/Item';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';

export const getItems = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

  const [data, total] = await Promise.all([
    Item.find(filter).populate('category', 'name type').skip(skip).limit(limit).sort({ name: 1 }),
    Item.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const getItem = asyncHandler(async (req: Request, res: Response) => {
  const data = await Item.findById(req.params.id).populate('category', 'name type');
  if (!data) throw new AppError('Item not found', 404);
  res.json({ success: true, data });
});

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const data = await Item.create(req.body);
  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'item', entityId: data._id, req });
  res.status(201).json({ success: true, data });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const data = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!data) throw new AppError('Item not found', 404);
  await logAction({ userId: req.user?.userId, action: 'update', entityType: 'item', entityId: req.params.id, req });
  res.json({ success: true, data });
});

export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  const data = await Item.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
  if (!data) throw new AppError('Item not found', 404);
  await logAction({ userId: req.user?.userId, action: 'delete', entityType: 'item', entityId: req.params.id, req });
  res.json({ success: true, data });
});
