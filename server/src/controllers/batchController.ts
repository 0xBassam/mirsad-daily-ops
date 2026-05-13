import { Request, Response } from 'express';
import { Batch } from '../models/Batch';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';

export const getBatches = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = { organization: orgId };
  if (req.query.status)      filter.status      = req.query.status;
  if (req.query.storageZone) filter.storageZone = req.query.storageZone;
  if (req.query.project)     filter.project     = req.query.project;
  if (req.query.item)        filter.item        = req.query.item;

  const [data, total] = await Promise.all([
    Batch.find(filter)
      .populate('item', 'name unit type category')
      .populate('supplier', 'name')
      .populate('project', 'name')
      .skip(skip).limit(limit)
      .sort({ receivedDate: 1 }), // FIFO default sort
    Batch.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const getBatch = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await Batch.findOne({ _id: req.params.id, organization: orgId })
    .populate('item', 'name unit type category')
    .populate('supplier', 'name contactName phone email')
    .populate('project', 'name')
    .populate('createdBy', 'fullName');
  if (!data) throw new AppError('Batch not found', 404);
  res.json({ success: true, data });
});

export const createBatch = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const body = { ...req.body, organization: orgId, createdBy: req.user?.userId, remainingQty: req.body.quantity };
  const data = await Batch.create(body);
  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'batch', entityId: data._id, req });
  res.status(201).json({ success: true, data });
});

export const updateBatch = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await Batch.findOneAndUpdate(
    { _id: req.params.id, organization: orgId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!data) throw new AppError('Batch not found', 404);
  await logAction({ userId: req.user?.userId, action: 'update', entityType: 'batch', entityId: req.params.id, req });
  res.json({ success: true, data });
});

// FEFO: batches sorted by expiryDate ASC (food items), FIFO: by receivedDate ASC (materials)
export const getExpiryTracking = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { page, limit, skip } = getPaginationParams(req);
  const now = new Date();
  const tab = (req.query.tab as string) || 'expired';

  let dateFilter: Record<string, unknown> = {};
  if (tab === 'expired') {
    dateFilter = { expiryDate: { $lt: now } };
  } else if (tab === 'today') {
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0, 0, 0, 0);
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    dateFilter = { expiryDate: { $gte: today, $lt: tomorrow } };
  } else if (tab === '3days') {
    const in3 = new Date(now); in3.setDate(in3.getDate() + 3);
    dateFilter = { expiryDate: { $gte: now, $lte: in3 } };
  } else if (tab === '7days') {
    const in7 = new Date(now); in7.setDate(in7.getDate() + 7);
    dateFilter = { expiryDate: { $gte: now, $lte: in7 } };
  }

  const filter = { organization: orgId, ...dateFilter, status: { $in: ['active', 'expired'] } };
  const [data, total] = await Promise.all([
    Batch.find(filter)
      .populate('item', 'name unit type')
      .populate('supplier', 'name')
      .populate('project', 'name')
      .skip(skip).limit(limit)
      .sort({ expiryDate: 1 }), // FEFO order
    Batch.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});
