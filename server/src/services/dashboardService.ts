import { format } from 'date-fns';
import { FloorCheck } from '../models/FloorCheck';
import { FloorCheckLine } from '../models/FloorCheckLine';
import { DailyPlan } from '../models/DailyPlan';
import { InventoryBalance } from '../models/InventoryBalance';
import { ApprovalRecord } from '../models/ApprovalRecord';

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const period = format(new Date(), 'yyyy-MM');

  const [
    totalChecksToday,
    completedChecks,
    pendingChecks,
    submittedReports,
    approvedReports,
    rejectedReports,
    shortageItems,
    lowStockItems,
    pendingApprovals,
    outOfStockItems,
  ] = await Promise.all([
    FloorCheck.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
    FloorCheck.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: { $in: ['approved', 'closed'] } }),
    FloorCheck.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'draft' }),
    FloorCheck.countDocuments({ status: 'submitted' }),
    FloorCheck.countDocuments({ status: 'approved' }),
    FloorCheck.countDocuments({ status: 'rejected' }),
    FloorCheckLine.countDocuments({ lineStatus: 'shortage' }),
    InventoryBalance.countDocuments({ period, status: 'low_stock' }),
    FloorCheck.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
    InventoryBalance.countDocuments({ period, status: 'out_of_stock' }),
  ]);

  const foodInventory = await InventoryBalance.aggregate([
    { $match: { period } },
    { $lookup: { from: 'items', localField: 'item', foreignField: '_id', as: 'item' } },
    { $unwind: '$item' },
    { $match: { 'item.type': 'food' } },
    {
      $group: {
        _id: null,
        available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
        lowStock: { $sum: { $cond: [{ $eq: ['$status', 'low_stock'] }, 1, 0] } },
        outOfStock: { $sum: { $cond: [{ $eq: ['$status', 'out_of_stock'] }, 1, 0] } },
        overConsumed: { $sum: { $cond: [{ $eq: ['$status', 'over_consumed'] }, 1, 0] } },
      },
    },
  ]);

  const materialsInventory = await InventoryBalance.aggregate([
    { $match: { period } },
    { $lookup: { from: 'items', localField: 'item', foreignField: '_id', as: 'item' } },
    { $unwind: '$item' },
    { $match: { 'item.type': 'material' } },
    {
      $group: {
        _id: null,
        available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
        lowStock: { $sum: { $cond: [{ $eq: ['$status', 'low_stock'] }, 1, 0] } },
        outOfStock: { $sum: { $cond: [{ $eq: ['$status', 'out_of_stock'] }, 1, 0] } },
      },
    },
  ]);

  const recentActivity = await ApprovalRecord.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('actor', 'fullName role');

  return {
    checks: {
      total: totalChecksToday,
      completed: completedChecks,
      pending: pendingChecks,
    },
    reports: {
      submitted: submittedReports,
      approved: approvedReports,
      rejected: rejectedReports,
    },
    shortages: shortageItems,
    lowStock: lowStockItems,
    outOfStock: outOfStockItems,
    pendingApprovals,
    foodInventory: foodInventory[0] || { available: 0, lowStock: 0, outOfStock: 0, overConsumed: 0 },
    materialsInventory: materialsInventory[0] || { available: 0, lowStock: 0, outOfStock: 0 },
    recentActivity,
  };
}
