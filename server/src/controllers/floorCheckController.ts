import { Request, Response } from 'express';
import { FloorCheck } from '../models/FloorCheck';
import { FloorCheckLine } from '../models/FloorCheckLine';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';
import { processFloorCheckApproval } from '../services/approvalService';

export const getFloorChecks = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = { organization: orgId };
  if (req.query.project) filter.project = req.query.project;
  if (req.query.floor) filter.floor = req.query.floor;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.supervisor) filter.supervisor = req.query.supervisor;
  if (req.query.dateFrom || req.query.dateTo) {
    filter.date = {};
    if (req.query.dateFrom) (filter.date as any).$gte = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) (filter.date as any).$lte = new Date(req.query.dateTo as string);
  }

  const [data, total] = await Promise.all([
    FloorCheck.find(filter)
      .populate('project', 'name')
      .populate('building', 'name')
      .populate('floor', 'name')
      .populate('supervisor', 'fullName')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1, createdAt: -1 }),
    FloorCheck.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const getFloorCheck = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const check = await FloorCheck.findOne({ _id: req.params.id, organization: orgId })
    .populate('project', 'name')
    .populate('building', 'name')
    .populate('floor', 'name')
    .populate('supervisor', 'fullName role')
    .populate('signatureAttachment')
    .populate({ path: 'approvalRecords', populate: { path: 'actor', select: 'fullName role' } });

  if (!check) throw new AppError('Floor check not found', 404);

  const lines = await FloorCheckLine.find({ floorCheck: req.params.id, organization: orgId })
    .populate('item', 'name unit type')
    .populate('photos');

  res.json({ success: true, data: { ...check.toObject(), lines } });
});

export const createFloorCheck = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { lines, ...checkData } = req.body;
  const check = await FloorCheck.create({
    ...checkData,
    organization: orgId,
    supervisor: checkData.supervisor || req.user?.userId,
  });

  if (lines?.length) {
    const lineDocs = lines.map((l: any) => ({ ...l, floorCheck: check._id, organization: orgId }));
    await FloorCheckLine.insertMany(lineDocs);
  }

  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'floor_check', entityId: check._id, req });
  res.status(201).json({ success: true, data: check });
});

export const updateFloorCheck = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const existing = await FloorCheck.findOne({ _id: req.params.id, organization: orgId });
  if (!existing) throw new AppError('Floor check not found', 404);
  if (!['draft', 'returned'].includes(existing.status)) {
    throw new AppError('Only draft or returned checks can be edited', 400);
  }

  const { lines, ...checkData } = req.body;
  const check = await FloorCheck.findOneAndUpdate(
    { _id: req.params.id, organization: orgId },
    checkData,
    { new: true, runValidators: true }
  );

  if (lines) {
    await FloorCheckLine.deleteMany({ floorCheck: req.params.id, organization: orgId });
    const lineDocs = lines.map((l: any) => ({ ...l, floorCheck: check!._id, organization: orgId }));
    await FloorCheckLine.insertMany(lineDocs);
  }

  await logAction({ userId: req.user?.userId, action: 'update', entityType: 'floor_check', entityId: req.params.id, req });
  res.json({ success: true, data: check });
});

export const submitFloorCheck = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { comment, signatureAttachmentId } = req.body;
  const check = await processFloorCheckApproval(
    req.params.id,
    'submit',
    req.user!,
    comment,
    signatureAttachmentId,
    orgId
  );
  await logAction({ userId: req.user?.userId, action: 'submit', entityType: 'floor_check', entityId: req.params.id, req });
  res.json({ success: true, data: check });
});

export const deleteFloorCheck = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const check = await FloorCheck.findOne({ _id: req.params.id, organization: orgId });
  if (!check) throw new AppError('Floor check not found', 404);
  if (check.status !== 'draft') throw new AppError('Only draft checks can be deleted', 400);
  await FloorCheckLine.deleteMany({ floorCheck: req.params.id, organization: orgId });
  await check.deleteOne();
  await logAction({ userId: req.user?.userId, action: 'delete', entityType: 'floor_check', entityId: req.params.id, req });
  res.json({ success: true });
});
