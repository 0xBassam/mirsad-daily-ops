import { Request, Response } from 'express';
import { Spoilage } from '../models/Spoilage';
import { StockMovement } from '../models/StockMovement';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';

// Manual spoilage recordings
export const getSpoilageRecords = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.reason)  filter.reason  = req.query.reason;

  const [data, total] = await Promise.all([
    Spoilage.find(filter)
      .populate('item', 'name unit type')
      .populate('batch', 'batchNumber')
      .populate('createdBy', 'fullName')
      .skip(skip).limit(limit)
      .sort({ date: -1 }),
    Spoilage.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const createSpoilageRecord = asyncHandler(async (req: Request, res: Response) => {
  const body = {
    ...req.body,
    createdBy: req.user?.userId,
    detectedAt: new Date(),
    alertType: req.body.reason === 'expired' ? 'expired'
      : req.body.reason === 'temperature_issue' ? 'temperature_breach'
      : req.body.reason === 'damaged' || req.body.reason === 'packaging_issue' ? 'damaged'
      : 'spoiled',
  };
  const data = await Spoilage.create(body);

  // Create DAMAGE stock movement automatically
  if (req.body.project && req.body.item) {
    await StockMovement.create({
      project: req.body.project,
      item: req.body.item,
      movementType: 'DAMAGE',
      quantity: req.body.quantity,
      movementDate: req.body.date || new Date(),
      sourceType: 'spoilage',
      sourceRef: data._id,
      notes: `Spoilage record: ${req.body.reason}`,
      createdBy: req.user?.userId,
    });
  }

  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'spoilage', entityId: data._id, req });
  res.status(201).json({ success: true, data });
});

// Spoilage alerts (system + manual, active/resolved/dismissed)
export const getSpoilageAlerts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;

  const [data, total] = await Promise.all([
    Spoilage.find(filter)
      .populate('item', 'name unit type')
      .populate('batch', 'batchNumber')
      .populate('resolvedBy', 'fullName')
      .skip(skip).limit(limit)
      .sort({ detectedAt: -1 }),
    Spoilage.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const resolveSpoilageAlert = asyncHandler(async (req: Request, res: Response) => {
  const data = await Spoilage.findByIdAndUpdate(
    req.params.id,
    { status: 'resolved', resolvedBy: req.user?.userId, resolvedAt: new Date() },
    { new: true }
  ).populate('item', 'name unit').populate('resolvedBy', 'fullName');
  if (!data) throw new AppError('Spoilage alert not found', 404);
  await logAction({ userId: req.user?.userId, action: 'update', entityType: 'spoilage', entityId: req.params.id, req });
  res.json({ success: true, data });
});
