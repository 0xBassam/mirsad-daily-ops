import { Request, Response } from 'express';
import { MaintenanceRequest } from '../models/MaintenanceRequest';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';
import { sendMaintenanceOpened, sendMaintenanceCompleted, getNotificationRecipients } from '../services/emailService';

const POPULATE = [
  { path: 'project',    select: 'name' },
  { path: 'building',   select: 'name' },
  { path: 'floor',      select: 'name' },
  { path: 'reportedBy', select: 'fullName' },
  { path: 'assignedTo', select: 'fullName' },
];

export const getMaintenanceRequests = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = { organization: orgId };
  if (req.query.status)   filter.status   = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.project)  filter.project  = req.query.project;

  const [data, total] = await Promise.all([
    MaintenanceRequest.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
    MaintenanceRequest.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const getMaintenanceRequest = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await MaintenanceRequest.findOne({ _id: req.params.id, organization: orgId }).populate(POPULATE);
  if (!data) throw new AppError('Maintenance request not found', 404);
  res.json({ success: true, data });
});

export const createMaintenanceRequest = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const data = await MaintenanceRequest.create({ ...req.body, organization: orgId, reportedBy: req.user?.userId });
  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'maintenance_request', entityId: data._id, req });
  res.status(201).json({ success: true, data });

  (async () => {
    try {
      const populated = await MaintenanceRequest.findById(data._id).populate('reportedBy', 'fullName').populate('floor', 'name').lean() as any;
      const recipients = await getNotificationRecipients(orgId);
      if (recipients.length) {
        await sendMaintenanceOpened({ to: recipients, title: data.title, category: data.category || '', priority: data.priority || '', location: populated?.floor?.name, maintenanceId: String(data._id), reporterName: populated?.reportedBy?.fullName }, orgId);
      }
    } catch { /* silent */ }
  })();
});

export const updateMaintenanceRequest = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const mr = await MaintenanceRequest.findOne({ _id: req.params.id, organization: orgId });
  if (!mr) throw new AppError('Maintenance request not found', 404);
  Object.assign(mr, req.body);
  await mr.save();
  await logAction({ userId: req.user?.userId, action: 'update', entityType: 'maintenance_request', entityId: mr._id, req });
  res.json({ success: true, data: mr });
});

export const assignMaintenanceRequest = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const mr = await MaintenanceRequest.findOne({ _id: req.params.id, organization: orgId });
  if (!mr) throw new AppError('Maintenance request not found', 404);
  if (mr.status !== 'open') throw new AppError('Request is not open', 400);
  mr.status = 'assigned';
  mr.assignedTo = req.body.assignedTo;
  mr.assignedAt = new Date();
  await mr.save();
  await logAction({ userId: req.user?.userId, action: 'assign', entityType: 'maintenance_request', entityId: mr._id, req });
  res.json({ success: true, data: mr });
});

export const startMaintenanceRequest = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const mr = await MaintenanceRequest.findOne({ _id: req.params.id, organization: orgId });
  if (!mr) throw new AppError('Maintenance request not found', 404);
  if (mr.status !== 'assigned') throw new AppError('Request must be assigned first', 400);
  mr.status = 'in_progress';
  await mr.save();
  res.json({ success: true, data: mr });
});

export const resolveMaintenanceRequest = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const mr = await MaintenanceRequest.findOne({ _id: req.params.id, organization: orgId });
  if (!mr) throw new AppError('Maintenance request not found', 404);
  if (!['assigned', 'in_progress'].includes(mr.status)) throw new AppError('Request must be in progress', 400);
  if (!req.body.resolution) throw new AppError('Resolution notes are required', 400);
  mr.status = 'resolved';
  mr.resolution = req.body.resolution;
  mr.resolvedAt = new Date();
  await mr.save();
  await logAction({ userId: req.user?.userId, action: 'resolve', entityType: 'maintenance_request', entityId: mr._id, req });
  res.json({ success: true, data: mr });

  (async () => {
    try {
      const recipients = await getNotificationRecipients(orgId);
      if (recipients.length) {
        await sendMaintenanceCompleted({ to: recipients, title: mr.title, category: (mr as any).category || '', priority: mr.priority || '', maintenanceId: String(mr._id) }, orgId);
      }
    } catch { /* silent */ }
  })();
});

export const closeMaintenanceRequest = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const mr = await MaintenanceRequest.findOne({ _id: req.params.id, organization: orgId });
  if (!mr) throw new AppError('Maintenance request not found', 404);
  if (mr.status !== 'resolved') throw new AppError('Request must be resolved before closing', 400);
  mr.status = 'closed';
  await mr.save();
  res.json({ success: true, data: mr });
});
