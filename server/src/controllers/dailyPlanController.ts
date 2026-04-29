import { Request, Response } from 'express';
import { DailyPlan } from '../models/DailyPlan';
import { DailyPlanLine } from '../models/DailyPlanLine';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';

export const getDailyPlans = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.dateFrom || req.query.dateTo) {
    filter.date = {};
    if (req.query.dateFrom) (filter.date as any).$gte = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) (filter.date as any).$lte = new Date(req.query.dateTo as string);
  }

  const [data, total] = await Promise.all([
    DailyPlan.find(filter)
      .populate('project', 'name')
      .populate('building', 'name')
      .populate('createdBy', 'fullName')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 }),
    DailyPlan.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

export const getDailyPlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await DailyPlan.findById(req.params.id)
    .populate('project', 'name')
    .populate('building', 'name')
    .populate('createdBy', 'fullName');
  if (!plan) throw new AppError('Daily plan not found', 404);

  const lines = await DailyPlanLine.find({ dailyPlan: req.params.id })
    .populate('floor', 'name')
    .populate('item', 'name unit type');

  res.json({ success: true, data: { ...plan.toObject(), lines } });
});

export const createDailyPlan = asyncHandler(async (req: Request, res: Response) => {
  const { lines, ...planData } = req.body;
  const plan = await DailyPlan.create({ ...planData, createdBy: req.user?.userId });

  if (lines?.length) {
    const linesDocs = lines.map((l: any) => ({ ...l, dailyPlan: plan._id }));
    await DailyPlanLine.insertMany(linesDocs);
  }

  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'daily_plan', entityId: plan._id, req });
  res.status(201).json({ success: true, data: plan });
});

export const updateDailyPlan = asyncHandler(async (req: Request, res: Response) => {
  const { lines, ...planData } = req.body;
  const plan = await DailyPlan.findByIdAndUpdate(req.params.id, planData, { new: true, runValidators: true });
  if (!plan) throw new AppError('Daily plan not found', 404);

  if (lines) {
    await DailyPlanLine.deleteMany({ dailyPlan: req.params.id });
    const linesDocs = lines.map((l: any) => ({ ...l, dailyPlan: plan._id }));
    await DailyPlanLine.insertMany(linesDocs);
  }

  await logAction({ userId: req.user?.userId, action: 'update', entityType: 'daily_plan', entityId: req.params.id, req });
  res.json({ success: true, data: plan });
});

export const copyDailyPlan = asyncHandler(async (req: Request, res: Response) => {
  const { targetDate } = req.body;
  if (!targetDate) throw new AppError('targetDate is required', 400);

  const sourcePlan = await DailyPlan.findById(req.params.id);
  if (!sourcePlan) throw new AppError('Source plan not found', 404);

  const sourceLines = await DailyPlanLine.find({ dailyPlan: req.params.id });

  const newPlan = await DailyPlan.create({
    date: new Date(targetDate),
    project: sourcePlan.project,
    building: sourcePlan.building,
    shift: sourcePlan.shift,
    status: 'draft',
    copiedFromDate: sourcePlan.date,
    createdBy: req.user?.userId,
  });

  const newLines = sourceLines.map(l => ({
    dailyPlan: newPlan._id,
    floor: l.floor,
    item: l.item,
    plannedQty: l.plannedQty,
  }));
  if (newLines.length) await DailyPlanLine.insertMany(newLines);

  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'daily_plan', entityId: newPlan._id, req });
  res.status(201).json({ success: true, data: newPlan });
});

export const deleteDailyPlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await DailyPlan.findByIdAndDelete(req.params.id);
  if (!plan) throw new AppError('Daily plan not found', 404);
  await DailyPlanLine.deleteMany({ dailyPlan: req.params.id });
  await logAction({ userId: req.user?.userId, action: 'delete', entityType: 'daily_plan', entityId: req.params.id, req });
  res.json({ success: true });
});
