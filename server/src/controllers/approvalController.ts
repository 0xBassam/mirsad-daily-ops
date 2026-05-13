import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { processFloorCheckApproval } from '../services/approvalService';
import { ApprovalRecord } from '../models/ApprovalRecord';
import { getPaginationParams, paginationMeta } from '../utils/paginate';

export const processApproval = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { entityType, entityId, action } = req.params;
  const { comment, signatureAttachmentId } = req.body;

  if (entityType !== 'floor_check') {
    res.status(400).json({ success: false, message: 'Unsupported entity type' });
    return;
  }

  const result = await processFloorCheckApproval(
    entityId,
    action as any,
    req.user!,
    comment,
    signatureAttachmentId,
    orgId
  );

  res.json({ success: true, data: result });
});

export const getApprovals = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = { organization: orgId };
  if (req.query.entityType) filter.entityType = req.query.entityType;
  if (req.query.action) filter.action = req.query.action;
  if (req.query.actor) filter.actor = req.query.actor;

  const [data, total] = await Promise.all([
    ApprovalRecord.find(filter)
      .populate('actor', 'fullName role')
      .populate('signatureAttachment')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    ApprovalRecord.countDocuments(filter),
  ]);

  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});
