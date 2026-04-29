import { Request, Response } from 'express';
import { Report } from '../models/Report';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { generateFloorCheckPDF, generateFloorCheckExcel, generateInventoryExcel } from '../services/reportService';
import { logAction } from '../services/auditService';
import { format } from 'date-fns';

export const getReports = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = {};
  if (req.query.reportType) filter.reportType = req.query.reportType;
  if (req.query.project) filter.project = req.query.project;

  const [data, total] = await Promise.all([
    Report.find(filter)
      .populate('project', 'name')
      .populate('generatedBy', 'fullName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Report.countDocuments(filter),
  ]);

  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const generateReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await Report.create({
    ...req.body,
    generatedBy: req.user?.userId,
    status: 'generated',
  });
  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'report', entityId: report._id, req });
  res.status(201).json({ success: true, data: report });
});

export const exportFloorCheckPDF = asyncHandler(async (req: Request, res: Response) => {
  await generateFloorCheckPDF(req.params.id, res);
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'floor_check', entityId: req.params.id, req });
});

export const exportFloorCheckExcel = asyncHandler(async (req: Request, res: Response) => {
  await generateFloorCheckExcel(req.params.id, res);
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'floor_check', entityId: req.params.id, req });
});

export const exportInventoryExcel = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  const period = (req.query.period as string) || format(new Date(), 'yyyy-MM');
  if (type !== 'food' && type !== 'material') throw new AppError('Type must be food or material', 400);
  await generateInventoryExcel(type, period, res);
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'inventory', req });
});
