import { Request, Response } from 'express';
import { InventoryBalance } from '../models/InventoryBalance';
import { StockMovement } from '../models/StockMovement';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';
import { format } from 'date-fns';

export const getFoodInventory = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const period = (req.query.period as string) || format(new Date(), 'yyyy-MM');
  const filter: Record<string, unknown> = { period };
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;

  const [data, total] = await Promise.all([
    InventoryBalance.find(filter)
      .populate({ path: 'item', match: { type: 'food' }, populate: { path: 'category', select: 'name' } })
      .populate('project', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ 'item.name': 1 }),
    InventoryBalance.countDocuments(filter),
  ]);

  const filtered = data.filter(b => b.item);
  res.json({ success: true, data: filtered, pagination: paginationMeta(total, page, limit) });
});

export const getMaterialsInventory = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const period = (req.query.period as string) || format(new Date(), 'yyyy-MM');
  const filter: Record<string, unknown> = { period };
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;

  const [data, total] = await Promise.all([
    InventoryBalance.find(filter)
      .populate({ path: 'item', match: { type: 'material' }, populate: { path: 'category', select: 'name' } })
      .populate('project', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ 'item.name': 1 }),
    InventoryBalance.countDocuments(filter),
  ]);

  const filtered = data.filter(b => b.item);
  res.json({ success: true, data: filtered, pagination: paginationMeta(total, page, limit) });
});

export const getMovements = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.item) filter.item = req.query.item;
  if (req.query.movementType) filter.movementType = req.query.movementType;
  if (req.query.dateFrom || req.query.dateTo) {
    filter.movementDate = {};
    if (req.query.dateFrom) (filter.movementDate as any).$gte = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) (filter.movementDate as any).$lte = new Date(req.query.dateTo as string);
  }

  const [data, total] = await Promise.all([
    StockMovement.find(filter)
      .populate('item', 'name unit type')
      .populate('project', 'name')
      .populate('createdBy', 'fullName')
      .skip(skip)
      .limit(limit)
      .sort({ movementDate: -1 }),
    StockMovement.countDocuments(filter),
  ]);

  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const createMovement = asyncHandler(async (req: Request, res: Response) => {
  const movement = await StockMovement.create({
    ...req.body,
    createdBy: req.user?.userId,
    movementDate: req.body.movementDate || new Date(),
  });

  const period = format(movement.movementDate, 'yyyy-MM');
  const balance = await InventoryBalance.findOneAndUpdate(
    { project: movement.project, item: movement.item, period },
    { $setOnInsert: { openingBalance: 0, monthlyLimit: 0 } },
    { upsert: true, new: true }
  );

  if (balance) {
    const type = movement.movementType;
    if (type === 'RECEIVE' || type === 'TRANSFER_IN' || type === 'RETURN') {
      if (type === 'RECEIVE') balance.receivedQty += movement.quantity;
      if (type === 'RETURN') balance.returnedQty += movement.quantity;
    } else if (type === 'ISSUE' || type === 'TRANSFER_OUT' || type === 'CONSUMPTION') {
      if (type === 'ISSUE') balance.issuedQty += movement.quantity;
      if (type === 'CONSUMPTION') balance.consumedQty += movement.quantity;
    } else if (type === 'DAMAGE') {
      balance.damagedQty += movement.quantity;
    } else if (type === 'ADJUSTMENT') {
      balance.receivedQty += movement.quantity;
    }
    (balance as any).recalculate();
    await balance.save();
  }

  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'stock_movement', entityId: movement._id, req });
  res.status(201).json({ success: true, data: movement });
});
