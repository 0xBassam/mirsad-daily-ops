import { Request, Response } from 'express';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { StockMovement } from '../models/StockMovement';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';
import { applyMovementToBalance } from '../services/inventoryService';
import { sendNewPurchaseOrder, getNotificationRecipients } from '../services/emailService';

export const getPurchaseOrders = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = { organization: orgId };
  if (req.query.project) filter.project  = req.query.project;
  if (req.query.status)  filter.status   = req.query.status;
  if (req.query.month)   filter.month    = req.query.month;
  if (req.query.supplier)filter.supplier = req.query.supplier;

  const [data, total] = await Promise.all([
    PurchaseOrder.find(filter)
      .populate('supplier', 'name category')
      .populate('project', 'name')
      .populate('createdBy', 'fullName')
      .skip(skip).limit(limit)
      .sort({ createdAt: -1 }),
    PurchaseOrder.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const getPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await PurchaseOrder.findOne({ _id: req.params.id, organization: orgId })
    .populate('supplier', 'name nameAr contactName phone email category')
    .populate('project', 'name')
    .populate('createdBy', 'fullName')
    .populate('lines.item', 'name unit type category');
  if (!data) throw new AppError('Purchase Order not found', 404);
  res.json({ success: true, data });
});

export const createPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  // Compute remainingQty for each line on creation
  const lines = (req.body.lines || []).map((l: any) => ({
    ...l,
    receivedQty: 0,
    distributedQty: 0,
    consumedQty: 0,
    remainingQty: l.approvedQty,
    variance: 0,
  }));
  const data = await PurchaseOrder.create({ ...req.body, lines, organization: orgId, createdBy: req.user?.userId });
  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'purchase_order', entityId: data._id, req });
  res.status(201).json({ success: true, data });

  (async () => {
    try {
      const populated = await PurchaseOrder.findById(data._id).populate('supplier', 'name').lean() as any;
      const recipients = await getNotificationRecipients(orgId);
      if (recipients.length) {
        await sendNewPurchaseOrder({ to: recipients, poNumber: data.poNumber, supplierName: populated?.supplier?.name || '—', month: data.month || '', lineCount: data.lines?.length || 0, poId: String(data._id) }, orgId);
      }
    } catch { /* silent */ }
  })();
});

export const updatePurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const po = await PurchaseOrder.findOne({ _id: req.params.id, organization: orgId });
  if (!po) throw new AppError('Purchase Order not found', 404);
  Object.assign(po, req.body);
  (po as any).recalculate();
  await po.save();
  await logAction({ userId: req.user?.userId, action: 'update', entityType: 'purchase_order', entityId: req.params.id, req });
  res.json({ success: true, data: po });
});

// Record stock receipt against a PO line
export const receivePOLine = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { lineId } = req.params;
  const { quantity, notes } = req.body;

  const po = await PurchaseOrder.findOne({ _id: req.params.id, organization: orgId });
  if (!po) throw new AppError('Purchase Order not found', 404);

  const line = po.lines.find(l => l._id.toString() === lineId);
  if (!line) throw new AppError('PO line not found', 404);

  line.receivedQty += quantity;
  (po as any).recalculate(); // sets remainingQty = approvedQty - receivedQty
  await po.save();

  const movDate = new Date();
  await StockMovement.create({
    organization: orgId,
    project: po.project, item: line.item, movementType: 'RECEIVE', quantity,
    movementDate: movDate, sourceType: 'purchase_order', sourceRef: po._id,
    notes: notes || `PO ${po.poNumber} — receive`, createdBy: req.user?.userId,
  });
  await applyMovementToBalance({ project: po.project as any, item: line.item as any, movementType: 'RECEIVE', quantity, date: movDate, organizationId: orgId });

  await logAction({ userId: req.user?.userId, action: 'update', entityType: 'purchase_order', entityId: po._id, req });
  res.json({ success: true, data: po });
});

// Record distribution/consumption against a PO line
export const distributePOLine = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { lineId } = req.params;
  const { quantity, type = 'distribute', notes } = req.body; // type: 'distribute' | 'consume'

  const po = await PurchaseOrder.findOne({ _id: req.params.id, organization: orgId });
  if (!po) throw new AppError('Purchase Order not found', 404);

  const line = po.lines.find(l => l._id.toString() === lineId);
  if (!line) throw new AppError('PO line not found', 404);

  if (type === 'consume') line.consumedQty  += quantity;
  else                    line.distributedQty += quantity;

  (po as any).recalculate();
  await po.save();

  const movType2 = type === 'consume' ? 'CONSUMPTION' : 'ISSUE';
  const movDate2 = new Date();
  await StockMovement.create({
    organization: orgId,
    project: po.project, item: line.item, movementType: movType2, quantity,
    movementDate: movDate2, sourceType: 'purchase_order', sourceRef: po._id,
    notes: notes || `PO ${po.poNumber} — ${type}`, createdBy: req.user?.userId,
  });
  await applyMovementToBalance({ project: po.project as any, item: line.item as any, movementType: movType2 as any, quantity, date: movDate2, organizationId: orgId });

  res.json({ success: true, data: po });
});
