import { Request, Response } from 'express';
import { ItemCategory } from '../models/ItemCategory';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';

export const getItemCategories = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = { organization: orgId };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;

  const [data, total] = await Promise.all([
    ItemCategory.find(filter).skip(skip).limit(limit).sort({ name: 1 }),
    ItemCategory.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const getItemCategory = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await ItemCategory.findOne({ _id: req.params.id, organization: orgId });
  if (!data) throw new AppError('Category not found', 404);
  res.json({ success: true, data });
});

export const createItemCategory = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await ItemCategory.create({ ...req.body, organization: orgId });
  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'item_category', entityId: data._id, req });
  res.status(201).json({ success: true, data });
});

export const updateItemCategory = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await ItemCategory.findOneAndUpdate(
    { _id: req.params.id, organization: orgId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!data) throw new AppError('Category not found', 404);
  await logAction({ userId: req.user?.userId, action: 'update', entityType: 'item_category', entityId: req.params.id, req });
  res.json({ success: true, data });
});

export const deleteItemCategory = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await ItemCategory.findOneAndUpdate(
    { _id: req.params.id, organization: orgId },
    { status: 'inactive' },
    { new: true }
  );
  if (!data) throw new AppError('Category not found', 404);
  await logAction({ userId: req.user?.userId, action: 'delete', entityType: 'item_category', entityId: req.params.id, req });
  res.json({ success: true, data });
});
