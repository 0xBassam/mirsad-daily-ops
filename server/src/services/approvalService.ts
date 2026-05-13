import mongoose from 'mongoose';
import { FloorCheck } from '../models/FloorCheck';
import { ApprovalRecord, ApprovalAction, ApprovalStep } from '../models/ApprovalRecord';
import { AppError } from '../utils/AppError';
import { updateOnApproval } from './inventoryService';
import { logAction } from './auditService';

type FloorCheckStatus = 'draft' | 'submitted' | 'under_review' | 'returned' | 'approved' | 'rejected' | 'closed';

const TRANSITIONS: Record<string, Record<string, FloorCheckStatus>> = {
  draft:        { submit: 'submitted' },
  submitted:    { review: 'under_review', reject: 'rejected' },
  under_review: { approve: 'approved', return: 'returned', reject: 'rejected' },
  returned:     { submit: 'submitted' },
  approved:     { close: 'closed' },
};

const ACTION_ROLES: Record<string, string[]> = {
  submit:  ['supervisor', 'admin'],
  review:  ['assistant_supervisor', 'admin'],
  approve: ['project_manager', 'admin'],
  return:  ['assistant_supervisor', 'project_manager', 'admin'],
  reject:  ['project_manager', 'admin'],
  close:   ['admin', 'project_manager'],
};

const ACTION_STEP: Record<ApprovalAction, ApprovalStep> = {
  submit:  'supervisor',
  review:  'assistant_supervisor',
  approve: 'project_manager',
  return:  'assistant_supervisor',
  reject:  'project_manager',
  close:   'project_manager',
};

export async function processFloorCheckApproval(
  floorCheckId: string,
  action: ApprovalAction,
  actor: { userId: string; role: string },
  comment?: string,
  signatureAttachmentId?: string,
  organizationId?: string | null
) {
  const checkFilter: Record<string, unknown> = { _id: floorCheckId };
  if (organizationId) checkFilter.organization = new mongoose.Types.ObjectId(organizationId);

  const check = await FloorCheck.findOne(checkFilter);
  if (!check) throw new AppError('Floor check not found', 404);

  const allowedRoles = ACTION_ROLES[action];
  if (!allowedRoles?.includes(actor.role)) {
    throw new AppError(`Role '${actor.role}' cannot perform action '${action}'`, 403);
  }

  const nextStatus = TRANSITIONS[check.status]?.[action];
  if (!nextStatus) {
    throw new AppError(`Cannot '${action}' a floor check in '${check.status}' status`, 400);
  }

  const existingRecords = await ApprovalRecord.countDocuments({
    entityType: 'floor_check',
    entityId: check._id,
  });

  const record = await ApprovalRecord.create({
    organization: organizationId ? new mongoose.Types.ObjectId(organizationId) : undefined,
    entityType: 'floor_check',
    entityId: check._id,
    step: ACTION_STEP[action],
    action,
    actor: actor.userId,
    comment,
    signatureAttachment: signatureAttachmentId,
    version: existingRecords + 1,
  });

  check.status = nextStatus;
  check.approvalRecords.push(record._id as any);

  if (nextStatus === 'approved') {
    check.currentApprovalStep = 'client';
  } else if (action === 'submit') {
    check.currentApprovalStep = 'assistant_supervisor';
  } else if (action === 'review') {
    check.currentApprovalStep = 'project_manager';
  } else if (action === 'return') {
    check.currentApprovalStep = 'supervisor';
  }

  await check.save();

  if (nextStatus === 'approved') {
    await updateOnApproval(floorCheckId);
  }

  await logAction({
    userId: actor.userId,
    organizationId: organizationId ?? null,
    action: action as any,
    entityType: 'floor_check',
    entityId: floorCheckId,
    newValue: { status: nextStatus },
  });

  return check;
}
