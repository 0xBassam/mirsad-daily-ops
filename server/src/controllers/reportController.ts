import { Request, Response } from 'express';
import { Report } from '../models/Report';
import { FloorCheck } from '../models/FloorCheck';
import { FloorCheckLine } from '../models/FloorCheckLine';
import { InventoryBalance } from '../models/InventoryBalance';
import { StockMovement } from '../models/StockMovement';
import { ApprovalRecord } from '../models/ApprovalRecord';
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

export const getReportById = asyncHandler(async (req: Request, res: Response) => {
  const report = await Report.findById(req.params.id)
    .populate('project', 'name')
    .populate('building', 'name')
    .populate('floor', 'name')
    .populate('generatedBy', 'fullName');
  if (!report) throw new AppError('Report not found', 404);
  res.json({ success: true, data: report });
});

export const getReportData = asyncHandler(async (req: Request, res: Response) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new AppError('Report not found', 404);

  const dateFrom = report.dateFrom || new Date(0);
  const dateTo   = report.dateTo   || new Date();
  const project  = report.project;

  let rows: unknown[] = [];
  let headers: string[] = [];

  if (report.reportType === 'monthly_food_inventory' || report.reportType === 'monthly_materials') {
    const type = report.reportType === 'monthly_food_inventory' ? 'food' : 'material';
    const period = format(dateFrom, 'yyyy-MM');
    const balances = await InventoryBalance.find({ period, ...(project ? { project } : {}) })
      .populate({ path: 'item', match: { type }, populate: { path: 'category', select: 'name' } })
      .lean();

    const filtered = balances.filter((b: any) => b.item);
    headers = ['Item', 'Category', 'Unit', 'Opening', 'Received', 'Consumed', 'Remaining', 'Status'];
    rows = filtered.map((b: any) => ({
      col1: b.item?.name,
      col2: b.item?.category?.name || '—',
      col3: b.item?.unit,
      col4: b.openingBalance,
      col5: b.receivedQty,
      col6: b.consumedQty ?? b.issuedQty,
      col7: b.remainingQty,
      col8: b.status,
    }));

  } else if (report.reportType === 'daily_floor_check') {
    const checks = await FloorCheck.find({
      date: { $gte: dateFrom, $lte: dateTo },
      ...(project ? { project } : {}),
      ...(report.building ? { building: report.building } : {}),
      ...(report.floor ? { floor: report.floor } : {}),
    })
      .populate('floor', 'name')
      .populate('building', 'name')
      .populate('supervisor', 'fullName')
      .lean();

    headers = ['Date', 'Floor', 'Building', 'Supervisor', 'Shift', 'Status'];
    rows = checks.map((c: any) => ({
      col1: format(new Date(c.date), 'dd/MM/yyyy'),
      col2: c.floor?.name,
      col3: c.building?.name,
      col4: c.supervisor?.fullName,
      col5: c.shift,
      col6: c.status,
    }));

  } else if (report.reportType === 'daily_project_summary') {
    const checks = await FloorCheck.find({
      date: { $gte: dateFrom, $lte: dateTo },
      ...(project ? { project } : {}),
    })
      .populate('floor', 'name')
      .populate('supervisor', 'fullName')
      .lean();

    headers = ['Date', 'Floor', 'Supervisor', 'Shift', 'Total Items', 'Status'];
    const lineCounts = await FloorCheckLine.aggregate([
      { $match: { floorCheck: { $in: checks.map((c: any) => c._id) } } },
      { $group: { _id: '$floorCheck', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(lineCounts.map((l: any) => [l._id.toString(), l.count]));

    rows = checks.map((c: any) => ({
      col1: format(new Date(c.date), 'dd/MM/yyyy'),
      col2: c.floor?.name,
      col3: c.supervisor?.fullName,
      col4: c.shift,
      col5: countMap[c._id.toString()] ?? 0,
      col6: c.status,
    }));

  } else if (report.reportType === 'weekly_warehouse') {
    const movements = await StockMovement.find({
      movementDate: { $gte: dateFrom, $lte: dateTo },
      ...(project ? { project } : {}),
    })
      .populate('item', 'name unit')
      .lean();

    headers = ['Date', 'Item', 'Unit', 'Type', 'Quantity', 'Source'];
    rows = movements.map((m: any) => ({
      col1: format(new Date(m.movementDate), 'dd/MM/yyyy'),
      col2: m.item?.name,
      col3: m.item?.unit,
      col4: m.movementType,
      col5: m.quantity,
      col6: m.sourceType,
    }));

  } else if (report.reportType === 'approval_summary') {
    const approvals = await ApprovalRecord.find({
      createdAt: { $gte: dateFrom, $lte: dateTo },
    })
      .populate('actor', 'fullName')
      .lean();

    headers = ['Date', 'Entity', 'Step', 'Actor', 'Action', 'Comment'];
    rows = approvals.map((a: any) => ({
      col1: format(new Date(a.createdAt), 'dd/MM/yyyy HH:mm'),
      col2: a.entityType,
      col3: a.step,
      col4: a.actor?.fullName,
      col5: a.action,
      col6: a.comment || '—',
    }));
  }

  res.json({ success: true, data: { headers, rows } });
});

export const generateReport = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body;
  const now  = new Date();
  const typeLabels: Record<string, string> = {
    daily_floor_check:     'Daily Floor Check Report',
    daily_project_summary: 'Daily Project Summary',
    weekly_warehouse:      'Weekly Warehouse Report',
    monthly_food_inventory:'Monthly Food Inventory Report',
    monthly_materials:     'Monthly Materials Report',
    approval_summary:      'Approval Summary Report',
  };
  const title = body.title || `${typeLabels[body.reportType] || 'Report'} — ${format(now, 'dd MMM yyyy')}`;

  const report = await Report.create({
    ...body,
    title,
    generatedBy: req.user?.userId,
    status: 'generated',
  });
  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'report', entityId: report._id, req });

  const populated = await Report.findById(report._id)
    .populate('project', 'name')
    .populate('generatedBy', 'fullName');
  res.status(201).json({ success: true, data: populated });
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
