import { format, addDays } from 'date-fns';
import { FloorCheck } from '../models/FloorCheck';
import { FloorCheckLine } from '../models/FloorCheckLine';
import { DailyPlan } from '../models/DailyPlan';
import { InventoryBalance } from '../models/InventoryBalance';
import { ApprovalRecord } from '../models/ApprovalRecord';
import { Batch } from '../models/Batch';
import { Spoilage } from '../models/Spoilage';
import { CorrectiveAction } from '../models/CorrectiveAction';
import { FridgeCheck } from '../models/FridgeCheck';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { Transfer } from '../models/Transfer';
import { MaintenanceRequest } from '../models/MaintenanceRequest';
import { ClientRequest } from '../models/ClientRequest';
import { AuditLog } from '../models/AuditLog';
import { StockMovement } from '../models/StockMovement';

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const in3Days = addDays(today, 3);
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
    // Phase 2–4 operational
    expiringIn3DaysCount,
    activeCorrectiveActionsCount,
    fridgeChecksTodayCount,
    activeSpoilageAlertsCount,
    openPurchaseOrdersCount,
    pendingTransfersCount,
    openMaintenanceCount,
    pendingClientRequestsCount,
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
    Batch.countDocuments({ status: 'active', expiryDate: { $gte: today, $lte: in3Days } }),
    CorrectiveAction.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    FridgeCheck.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
    Spoilage.countDocuments({ status: 'active' }),
    PurchaseOrder.countDocuments({ status: { $nin: ['fully_received', 'closed'] } }),
    Transfer.countDocuments({ status: 'draft' }),
    MaintenanceRequest.countDocuments({ status: { $in: ['open', 'assigned'] } }),
    ClientRequest.countDocuments({ status: { $in: ['submitted', 'assigned', 'in_progress'] } }),
  ]);

  const [foodInventory, materialsInventory, topConsumedItems, checksByFloor, recentActivity] = await Promise.all([
    InventoryBalance.aggregate([
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
    ]),

    InventoryBalance.aggregate([
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
    ]),

    // Top 5 most-issued items from stock movements
    StockMovement.aggregate([
      { $match: { movementType: 'ISSUE' } },
      { $group: { _id: '$item', consumed: { $sum: '$quantity' } } },
      { $sort: { consumed: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'items', localField: '_id', foreignField: '_id', as: 'item' } },
      { $unwind: { path: '$item', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: { $ifNull: ['$item.name', 'Unknown'] }, consumed: 1 } },
    ]),

    // Floor check counts grouped by floor (top 8)
    FloorCheck.aggregate([
      { $group: { _id: '$floor', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $lookup: { from: 'floors', localField: '_id', foreignField: '_id', as: 'floor' } },
      { $unwind: { path: '$floor', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: { $ifNull: ['$floor.name', 'Unknown'] }, count: 1 } },
    ]),

    // Recent activity from audit log (richer than approval records alone)
    AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'fullName role')
      .lean(),
  ]);

  // Shape audit log entries to match the expected recentActivity format
  const shapedActivity = recentActivity.map((log: any) => ({
    _id: log._id,
    action: log.action,
    createdAt: log.createdAt,
    actor: log.user || { fullName: 'System' },
    entityType: log.entityType,
  }));

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
    recentActivity: shapedActivity,
    expiringIn3Days: expiringIn3DaysCount,
    activeCorrectiveActions: activeCorrectiveActionsCount,
    fridgeChecksToday: fridgeChecksTodayCount,
    activeSpoilageAlerts: activeSpoilageAlertsCount,
    topConsumedItems: topConsumedItems.length ? topConsumedItems : undefined,
    checksByFloor: checksByFloor.length ? checksByFloor : undefined,
    openPurchaseOrders: openPurchaseOrdersCount,
    pendingTransfers: pendingTransfersCount,
    openMaintenanceRequests: openMaintenanceCount,
    pendingClientRequests: pendingClientRequestsCount,
  };
}
