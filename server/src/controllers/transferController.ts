import { Request, Response } from 'express';
import { Transfer } from '../models/Transfer';
import { StockMovement } from '../models/StockMovement';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';

export const getTransfers = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = { organization: orgId };
  if (req.query.status)  filter.status  = req.query.status;
  if (req.query.project) filter.project = req.query.project;
  if (req.query.floor)   filter.floor   = req.query.floor;

  const [data, total] = await Promise.all([
    Transfer.find(filter)
      .populate('project', 'name')
      .populate('building', 'name')
      .populate('floor', 'name')
      .populate('createdBy', 'fullName')
      .populate('confirmedBy', 'fullName')
      .populate('lines.item', 'name unit type')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit),
    Transfer.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const getTransfer = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await Transfer.findOne({ _id: req.params.id, organization: orgId })
    .populate('project', 'name')
    .populate('building', 'name')
    .populate('floor', 'name')
    .populate('createdBy', 'fullName')
    .populate('confirmedBy', 'fullName')
    .populate('lines.item', 'name unit type');
  if (!data) throw new AppError('Transfer not found', 404);
  res.json({ success: true, data });
});

export const createTransfer = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await Transfer.create({ ...req.body, organization: orgId, createdBy: req.user?.userId });
  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'transfer', entityId: data._id, req });
  res.status(201).json({ success: true, data });
});

export const updateTransfer = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const transfer = await Transfer.findOne({ _id: req.params.id, organization: orgId });
  if (!transfer) throw new AppError('Transfer not found', 404);
  if (transfer.status !== 'draft') throw new AppError('Only draft transfers can be edited', 400);
  Object.assign(transfer, req.body);
  await transfer.save();
  res.json({ success: true, data: transfer });
});

export const confirmTransfer = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const transfer = await Transfer.findOne({ _id: req.params.id, organization: orgId });
  if (!transfer) throw new AppError('Transfer not found', 404);
  if (transfer.status !== 'draft') throw new AppError('Transfer is not in draft status', 400);

  transfer.status = 'confirmed';
  transfer.confirmedBy = req.user?.userId as any;
  transfer.confirmedAt = new Date();
  await transfer.save();

  await StockMovement.insertMany(transfer.lines.map(line => ({
    organization: orgId,
    project: transfer.project,
    item: line.item,
    movementType: 'ISSUE',
    quantity: line.quantity,
    movementDate: transfer.transferDate,
    sourceType: 'transfer',
    sourceRef: transfer._id,
    notes: 'Transfer to floor',
    createdBy: req.user?.userId,
  })));

  await logAction({ userId: req.user?.userId, action: 'confirm', entityType: 'transfer', entityId: transfer._id, req });
  res.json({ success: true, data: transfer });
});

export const cancelTransfer = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const transfer = await Transfer.findOne({ _id: req.params.id, organization: orgId });
  if (!transfer) throw new AppError('Transfer not found', 404);
  if (transfer.status !== 'draft') throw new AppError('Only draft transfers can be cancelled', 400);
  transfer.status = 'cancelled';
  await transfer.save();
  await logAction({ userId: req.user?.userId, action: 'cancel', entityType: 'transfer', entityId: transfer._id, req });
  res.json({ success: true, data: transfer });
});
