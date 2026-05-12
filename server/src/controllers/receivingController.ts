import { Request, Response } from 'express';
import { Receiving } from '../models/Receiving';
import { StockMovement } from '../models/StockMovement';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';
import { applyMovementToBalance } from '../services/inventoryService';

export const getReceivings = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = {};
  if (req.query.status)        filter.status        = req.query.status;
  if (req.query.project)       filter.project       = req.query.project;
  if (req.query.supplier)      filter.supplier      = req.query.supplier;
  if (req.query.purchaseOrder) filter.purchaseOrder = req.query.purchaseOrder;

  const [data, total] = await Promise.all([
    Receiving.find(filter)
      .populate('project', 'name')
      .populate('supplier', 'name')
      .populate('purchaseOrder', 'poNumber')
      .populate('receivedBy', 'fullName')
      .populate('lines.item', 'name unit type')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit),
    Receiving.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const getReceiving = asyncHandler(async (req: Request, res: Response) => {
  const data = await Receiving.findById(req.params.id)
    .populate('project', 'name')
    .populate('supplier', 'name contactName phone')
    .populate('purchaseOrder', 'poNumber status')
    .populate('receivedBy', 'fullName')
    .populate('confirmedBy', 'fullName')
    .populate('lines.item', 'name unit type');
  if (!data) throw new AppError('Receiving record not found', 404);
  res.json({ success: true, data });
});

export const createReceiving = asyncHandler(async (req: Request, res: Response) => {
  const data = await Receiving.create({ ...req.body, receivedBy: req.user?.userId });
  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'receiving', entityId: data._id, req });
  res.status(201).json({ success: true, data });
});

export const updateReceiving = asyncHandler(async (req: Request, res: Response) => {
  const receiving = await Receiving.findById(req.params.id);
  if (!receiving) throw new AppError('Receiving record not found', 404);
  if (!['pending'].includes(receiving.status)) throw new AppError('Only pending records can be edited', 400);
  Object.assign(receiving, req.body);
  await receiving.save();
  res.json({ success: true, data: receiving });
});

export const confirmReceiving = asyncHandler(async (req: Request, res: Response) => {
  const receiving = await Receiving.findById(req.params.id);
  if (!receiving) throw new AppError('Receiving record not found', 404);
  if (!['pending', 'partial'].includes(receiving.status)) throw new AppError('Already confirmed or rejected', 400);

  const goodLines   = receiving.lines.filter(l => l.condition !== 'rejected');
  const rejectedAll = goodLines.length === 0;
  const partialOk   = receiving.lines.some(l => l.condition === 'rejected') && goodLines.length > 0;

  receiving.status     = rejectedAll ? 'rejected' : partialOk ? 'partial' : 'confirmed';
  receiving.confirmedBy = req.user?.userId as any;
  receiving.confirmedAt = new Date();
  await receiving.save();

  for (const line of goodLines) {
    await StockMovement.create({
      project: receiving.project, item: line.item, movementType: 'RECEIVE',
      quantity: line.quantityReceived, movementDate: receiving.deliveryDate,
      sourceType: 'receiving', sourceRef: receiving._id,
      notes: receiving.invoiceNumber ? `Invoice ${receiving.invoiceNumber}` : 'Delivery received',
      createdBy: req.user?.userId,
    });
    await applyMovementToBalance({ project: receiving.project as any, item: line.item as any, movementType: 'RECEIVE', quantity: line.quantityReceived, date: receiving.deliveryDate });
  }

  // Update linked PO receivedQty
  if (receiving.purchaseOrder) {
    const po = await PurchaseOrder.findById(receiving.purchaseOrder);
    if (po) {
      for (const line of goodLines) {
        if (line.purchaseOrderLine) {
          const pol = po.lines.find(pl => pl._id.toString() === line.purchaseOrderLine!.toString());
          if (pol) pol.receivedQty += line.quantityReceived;
        }
      }
      (po as any).recalculate();
      await po.save();
    }
  }

  await logAction({ userId: req.user?.userId, action: 'confirm', entityType: 'receiving', entityId: receiving._id, req });
  res.json({ success: true, data: receiving });
});
