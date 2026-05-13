import { Request, Response } from 'express';
import { FridgeCheck } from '../models/FridgeCheck';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';

export const getFridgeChecks = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = { organization: orgId };
  if (req.query.project) filter.project  = req.query.project;
  if (req.query.floor)   filter.floor    = req.query.floor;
  if (req.query.status)  filter.status   = req.query.status;

  const [data, total] = await Promise.all([
    FridgeCheck.find(filter)
      .populate('project',  'name')
      .populate('building', 'name')
      .populate('floor',    'name')
      .populate('checkedBy', 'fullName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    FridgeCheck.countDocuments(filter),
  ]);

  res.json({ success: true, data, meta: paginationMeta(total, page, limit) });
});

export const getFridgeCheckById = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const check = await FridgeCheck.findOne({ _id: req.params.id, organization: orgId })
    .populate('project',  'name')
    .populate('building', 'name')
    .populate('floor',    'name')
    .populate('checkedBy', 'fullName')
    .populate('itemsChecked.batch', 'batchNumber')
    .populate('itemsChecked.item',  'name unit')
    .lean();

  if (!check) throw new AppError('Fridge check not found', 404);
  res.json({ success: true, data: check });
});

export const createFridgeCheck = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const userId  = (req as any).user._id;
  const body    = req.body;
  const now     = new Date();

  // Compute isExpired / isNearExpiry for each item
  const nearExpiryThreshold = 3 * 24 * 60 * 60 * 1000; // 3 days
  const itemsChecked = (body.itemsChecked || []).map((line: any) => {
    const expiry   = new Date(line.expiryDate);
    const isExpired    = expiry < now;
    const isNearExpiry = !isExpired && (expiry.getTime() - now.getTime()) < nearExpiryThreshold;
    return { ...line, isExpired, isNearExpiry };
  });

  // Auto-compute status
  const tempOk       = body.temperature >= body.expectedTempMin && body.temperature <= body.expectedTempMax;
  const hasExpired   = itemsChecked.some((i: any) => i.isExpired || i.condition === 'expired');
  const hasDamaged   = itemsChecked.some((i: any) => i.condition === 'damaged');
  let status: 'ok' | 'issue_found' | 'corrective_action_required' = 'ok';
  if (hasExpired || hasDamaged) status = 'corrective_action_required';
  else if (!tempOk || !body.cleanlinessOk || itemsChecked.some((i: any) => i.isNearExpiry)) status = 'issue_found';

  const check = await FridgeCheck.create({
    ...body,
    organization: orgId,
    itemsChecked,
    status,
    checkedBy: userId,
  });

  await logAction({ userId: userId.toString(), action: 'create', entityType: 'fridge_check', entityId: check._id, req });
  res.status(201).json({ success: true, data: check });
});
