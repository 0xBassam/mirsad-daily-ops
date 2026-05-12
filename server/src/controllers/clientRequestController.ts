import { Request, Response } from 'express';
import { ClientRequest } from '../models/ClientRequest';
import { Item } from '../models/Item';
import { StockMovement } from '../models/StockMovement';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';
import { applyMovementToBalance } from '../services/inventoryService';

const POPULATE = [
  { path: 'project',     select: 'name' },
  { path: 'building',    select: 'name' },
  { path: 'floor',       select: 'name' },
  { path: 'requestedBy', select: 'fullName role' },
  { path: 'assignedTo',  select: 'fullName' },
];

export const getClientRequests = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = {};
  if (req.query.status)      filter.status      = req.query.status;
  if (req.query.requestType) filter.requestType = req.query.requestType;
  if (req.query.priority)    filter.priority    = req.query.priority;
  if (req.query.project)     filter.project     = req.query.project;

  const [data, total] = await Promise.all([
    ClientRequest.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ClientRequest.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const getClientRequest = asyncHandler(async (req: Request, res: Response) => {
  const data = await ClientRequest.findById(req.params.id).populate(POPULATE);
  if (!data) throw new AppError('Client request not found', 404);
  res.json({ success: true, data });
});

export const createClientRequest = asyncHandler(async (req: Request, res: Response) => {
  const data = await ClientRequest.create({ ...req.body, requestedBy: req.user?.userId });
  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'client_request', entityId: data._id, req });
  res.status(201).json({ success: true, data });
});

export const updateClientRequest = asyncHandler(async (req: Request, res: Response) => {
  const cr = await ClientRequest.findById(req.params.id);
  if (!cr) throw new AppError('Client request not found', 404);
  Object.assign(cr, req.body);
  await cr.save();
  res.json({ success: true, data: cr });
});

export const assignClientRequest = asyncHandler(async (req: Request, res: Response) => {
  const cr = await ClientRequest.findById(req.params.id);
  if (!cr) throw new AppError('Client request not found', 404);
  if (cr.status !== 'submitted') throw new AppError('Request is not in submitted status', 400);
  cr.status = 'assigned';
  cr.assignedTo = req.body.assignedTo;
  await cr.save();
  await logAction({ userId: req.user?.userId, action: 'assign', entityType: 'client_request', entityId: cr._id, req });
  res.json({ success: true, data: cr });
});

export const startClientRequest = asyncHandler(async (req: Request, res: Response) => {
  const cr = await ClientRequest.findById(req.params.id);
  if (!cr) throw new AppError('Client request not found', 404);
  if (cr.status !== 'assigned') throw new AppError('Request must be assigned first', 400);
  cr.status = 'in_progress';
  await cr.save();
  res.json({ success: true, data: cr });
});

export const deliverClientRequest = asyncHandler(async (req: Request, res: Response) => {
  const cr = await ClientRequest.findById(req.params.id);
  if (!cr) throw new AppError('Client request not found', 404);
  if (cr.status !== 'in_progress') throw new AppError('Request must be in progress', 400);
  cr.status = 'delivered';
  cr.deliveredAt = new Date();
  if (req.body.notes) cr.notes = req.body.notes;
  await cr.save();

  // Auto-consume inventory for request items (best-effort name match, never blocks delivery)
  if (cr.items?.length && cr.project) {
    const movDate = new Date();
    for (const reqItem of cr.items) {
      try {
        const invItem = await Item.findOne({ name: { $regex: new RegExp(`^${reqItem.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        if (!invItem) continue;
        await StockMovement.create({
          project: cr.project, item: invItem._id, movementType: 'CONSUMPTION',
          quantity: reqItem.quantity, movementDate: movDate,
          sourceType: 'client_request', sourceRef: cr._id,
          notes: cr.title, createdBy: req.user?.userId,
        });
        await applyMovementToBalance({ project: cr.project as any, item: invItem._id as any, movementType: 'CONSUMPTION', quantity: reqItem.quantity, date: movDate });
      } catch { /* silent — don't fail delivery if inventory lookup errors */ }
    }
  }

  await logAction({ userId: req.user?.userId, action: 'deliver', entityType: 'client_request', entityId: cr._id, req });
  res.json({ success: true, data: cr });
});

export const confirmClientRequest = asyncHandler(async (req: Request, res: Response) => {
  const cr = await ClientRequest.findById(req.params.id);
  if (!cr) throw new AppError('Client request not found', 404);
  if (cr.status !== 'delivered') throw new AppError('Request must be delivered first', 400);
  cr.status = 'confirmed';
  cr.confirmedAt = new Date();
  await cr.save();
  await logAction({ userId: req.user?.userId, action: 'confirm', entityType: 'client_request', entityId: cr._id, req });
  res.json({ success: true, data: cr });
});

export const rejectClientRequest = asyncHandler(async (req: Request, res: Response) => {
  const cr = await ClientRequest.findById(req.params.id);
  if (!cr) throw new AppError('Client request not found', 404);
  if (['confirmed', 'rejected'].includes(cr.status)) throw new AppError('Cannot reject this request', 400);
  cr.status = 'rejected';
  cr.rejectionReason = req.body.rejectionReason || '';
  await cr.save();
  await logAction({ userId: req.user?.userId, action: 'reject', entityType: 'client_request', entityId: cr._id, req });
  res.json({ success: true, data: cr });
});
