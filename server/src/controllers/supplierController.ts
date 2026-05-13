import { Request, Response } from 'express';
import { Supplier } from '../models/Supplier';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';

export const getSuppliers = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = { organization: orgId };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status)   filter.status   = req.query.status;
  if (req.query.search)   filter.name     = { $regex: req.query.search, $options: 'i' };

  const [data, total] = await Promise.all([
    Supplier.find(filter).skip(skip).limit(limit).sort({ name: 1 }),
    Supplier.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const getSupplier = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await Supplier.findOne({ _id: req.params.id, organization: orgId });
  if (!data) throw new AppError('Supplier not found', 404);
  res.json({ success: true, data });
});

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await Supplier.create({ ...req.body, organization: orgId });
  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'supplier', entityId: data._id, req });
  res.status(201).json({ success: true, data });
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await Supplier.findOneAndUpdate(
    { _id: req.params.id, organization: orgId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!data) throw new AppError('Supplier not found', 404);
  await logAction({ userId: req.user?.userId, action: 'update', entityType: 'supplier', entityId: req.params.id, req });
  res.json({ success: true, data });
});
