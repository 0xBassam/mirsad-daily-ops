import { Request, Response } from 'express';
import { format, subMonths } from 'date-fns';
import mongoose from 'mongoose';
import { ClientRequest } from '../models/ClientRequest';
import { InventoryBalance } from '../models/InventoryBalance';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { getSystemSettings } from '../models/SystemSettings';

export const getClientDashboard = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const userId    = req.user?.userId;
  const period    = format(new Date(), 'yyyy-MM');
  const today     = new Date();
  today.setHours(0, 0, 0, 0);

  const userDoc = await User.findOne({ _id: userId, organization: orgId }).select('project').lean() as any;
  const projectId = userDoc?.project ?? null;

  const requestFilter: Record<string, unknown> = {
    organization: orgId,
    requestedBy: userId,
  };

  const [
    statsByStatus,
    byTypeAgg,
    byFloorAgg,
    upcomingRaw,
    awaitingRaw,
    recentRaw,
    monthlyAgg,
    stockAgg,
    settings,
  ] = await Promise.all([
    ClientRequest.aggregate([
      { $match: requestFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    ClientRequest.aggregate([
      { $match: requestFilter },
      { $group: { _id: '$requestType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    ClientRequest.aggregate([
      { $match: { ...requestFilter, floor: { $exists: true, $ne: null } } },
      { $lookup: { from: 'floors', localField: 'floor', foreignField: '_id', as: 'f' } },
      { $unwind: { path: '$f', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$f.name', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),

    ClientRequest.find({
      ...requestFilter,
      scheduledDate: { $gte: today },
      status: { $nin: ['confirmed', 'rejected'] },
    })
      .populate('floor', 'name')
      .sort({ scheduledDate: 1 })
      .limit(8)
      .lean(),

    ClientRequest.find({ ...requestFilter, status: 'delivered' })
      .populate('floor', 'name')
      .sort({ deliveredAt: -1 })
      .limit(5)
      .lean(),

    ClientRequest.find(requestFilter)
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean(),

    ClientRequest.aggregate([
      {
        $match: {
          ...requestFilter,
          createdAt: { $gte: subMonths(new Date(), 6) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    projectId
      ? InventoryBalance.aggregate([
          { $match: { organization: new mongoose.Types.ObjectId(orgId), period, project: projectId } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
      : Promise.resolve([]),

    getSystemSettings(),
  ]);

  // Stats map
  const sm: Record<string, number> = {};
  for (const s of statsByStatus) sm[s._id] = s.count;
  const stats = {
    total:      Object.values(sm).reduce((a, b) => a + b, 0),
    submitted:  sm.submitted  || 0,
    assigned:   sm.assigned   || 0,
    in_progress: sm.in_progress || 0,
    delivered:  sm.delivered  || 0,
    confirmed:  sm.confirmed  || 0,
    rejected:   sm.rejected   || 0,
    active:     (sm.submitted || 0) + (sm.assigned || 0) + (sm.in_progress || 0),
  };

  // Monthly trend — fill gaps for last 6 months
  const trendMap: Record<string, number> = {};
  for (const m of monthlyAgg) trendMap[m._id] = m.count;
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d   = subMonths(new Date(), i);
    const key = format(d, 'yyyy-MM');
    monthlyTrend.push({ month: format(d, 'MMM yy'), count: trendMap[key] || 0 });
  }

  // Stock summary map
  const stk: Record<string, number> = {};
  for (const s of stockAgg) stk[s._id] = s.count;

  res.json({
    success: true,
    data: {
      branding: {
        clientName:       settings.clientName       || '',
        clientLogoUrl:    settings.clientLogoUrl    || '',
        clientSiteName:   settings.clientSiteName   || '',
        clientDepartment: settings.clientDepartment || '',
      },
      stats,
      byType:  byTypeAgg.map(r => ({ type: r._id, count: r.count })),
      byFloor: byFloorAgg.map(r => ({ floor: r._id, count: r.count })),
      upcoming:             upcomingRaw,
      awaitingConfirmation: awaitingRaw,
      recentActivity:       recentRaw,
      monthlyTrend,
      stockSummary: {
        available:    stk.available    || 0,
        lowStock:     stk.low_stock    || 0,
        outOfStock:   stk.out_of_stock || 0,
        overConsumed: stk.over_consumed || 0,
      },
    },
  });
});
