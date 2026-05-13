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
import { Receiving } from '../models/Receiving';

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
    expiringIn3DaysCount,
    activeCorrectiveActionsCount,
    fridgeChecksTodayCount,
    activeSpoilageAlertsCount,
    openPurchaseOrdersCount,
    pendingTransfersCount,
    openMaintenanceCount,
    operationRequestsOpen,
    coffeeBreakRequestsOpen,
    receivingTodayCount,
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
    ClientRequest.countDocuments({ requestType: 'operation_request', status: { $in: ['submitted', 'assigned', 'in_progress'] } }),
    ClientRequest.countDocuments({ requestType: 'coffee_break_request', status: { $in: ['submitted', 'assigned', 'in_progress'] } }),
    Receiving.countDocuments({ deliveryDate: { $gte: today, $lt: tomorrow } }),
  ]);

  const [
    foodInventory,
    materialsInventory,
    topConsumedItems,
    todayConsumptionRaw,
    checksByFloor,
    recentActivity,
    latestOperationRequests,
    latestCoffeeBreakRequests,
    latestReceiving,
    recentPurchaseOrders,
    lowStockItemsList,
  ] = await Promise.all([
    InventoryBalance.aggregate([
      { $match: { period } },
      { $lookup: { from: 'items', localField: 'item', foreignField: '_id', as: 'item' } },
      { $unwind: '$item' },
      { $match: { 'item.type': 'food' } },
      {
        $group: {
          _id: null,
          available:    { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
          lowStock:     { $sum: { $cond: [{ $eq: ['$status', 'low_stock'] }, 1, 0] } },
          outOfStock:   { $sum: { $cond: [{ $eq: ['$status', 'out_of_stock'] }, 1, 0] } },
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
          available:  { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
          lowStock:   { $sum: { $cond: [{ $eq: ['$status', 'low_stock'] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$status', 'out_of_stock'] }, 1, 0] } },
        },
      },
    ]),

    StockMovement.aggregate([
      { $match: { movementType: { $in: ['CONSUMPTION', 'ISSUE'] } } },
      { $group: { _id: '$item', consumed: { $sum: '$quantity' } } },
      { $sort: { consumed: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'items', localField: '_id', foreignField: '_id', as: 'item' } },
      { $unwind: { path: '$item', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: { $ifNull: ['$item.name', 'Unknown'] }, consumed: 1 } },
    ]),

    // Today's consumption total
    StockMovement.aggregate([
      { $match: { movementType: { $in: ['CONSUMPTION', 'ISSUE'] }, movementDate: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, totalQty: { $sum: '$quantity' }, totalTxns: { $sum: 1 } } },
    ]),

    FloorCheck.aggregate([
      { $group: { _id: '$floor', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $lookup: { from: 'floors', localField: '_id', foreignField: '_id', as: 'floor' } },
      { $unwind: { path: '$floor', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: { $ifNull: ['$floor.name', 'Unknown'] }, count: 1 } },
    ]),

    AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'fullName role')
      .lean(),

    // Latest operation requests
    ClientRequest.find({ requestType: 'operation_request' })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('floor', 'name')
      .populate('requestedBy', 'fullName')
      .lean(),

    // Latest coffee break requests
    ClientRequest.find({ requestType: 'coffee_break_request' })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('floor', 'name')
      .populate('requestedBy', 'fullName')
      .lean(),

    // Latest receiving records
    Receiving.find()
      .sort({ deliveryDate: -1, createdAt: -1 })
      .limit(5)
      .populate('supplier', 'name')
      .lean(),

    // Recent purchase orders
    PurchaseOrder.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('supplier', 'name')
      .lean(),

    // Low stock items list (top 8)
    InventoryBalance.aggregate([
      { $match: { period, status: { $in: ['low_stock', 'out_of_stock'] } } },
      { $lookup: { from: 'items', localField: 'item', foreignField: '_id', as: 'itemData' } },
      { $unwind: { path: '$itemData', preserveNullAndEmptyArrays: true } },
      { $sort: { remainingQty: 1 } },
      { $limit: 8 },
      {
        $project: {
          _id: 0,
          name: { $ifNull: ['$itemData.name', 'Unknown'] },
          type: { $ifNull: ['$itemData.type', 'food'] },
          unit: { $ifNull: ['$itemData.unit', 'pcs'] },
          remainingQty: 1,
          monthlyLimit: 1,
          status: 1,
        },
      },
    ]),
  ]);

  const shapedActivity = (recentActivity as any[]).map((log: any) => ({
    _id: log._id,
    action: log.action,
    createdAt: log.createdAt,
    actor: log.user || { fullName: 'System' },
    entityType: log.entityType,
  }));

  const shapedOpRequests = (latestOperationRequests as any[]).map((r: any) => ({
    _id: r._id,
    title: r.title,
    floor: r.floor?.name || '—',
    priority: r.priority,
    status: r.status,
    itemCount: r.items?.length || 0,
    createdAt: r.createdAt,
  }));

  const shapedCbRequests = (latestCoffeeBreakRequests as any[]).map((r: any) => ({
    _id: r._id,
    title: r.title,
    floor: r.floor?.name || '—',
    priority: r.priority,
    status: r.status,
    itemCount: r.items?.length || 0,
    createdAt: r.createdAt,
  }));

  const shapedReceiving = (latestReceiving as any[]).map((r: any) => ({
    _id: r._id,
    supplierName: (r.supplier as any)?.name || '—',
    deliveryDate: r.deliveryDate,
    lineCount: r.lines?.length || 0,
    status: r.status,
    invoiceNumber: r.invoiceNumber,
  }));

  const shapedPOs = (recentPurchaseOrders as any[]).map((po: any) => ({
    _id: po._id,
    poNumber: po.poNumber,
    supplierName: (po.supplier as any)?.name || '—',
    month: po.month,
    status: po.status,
    lineCount: po.lines?.length || 0,
    receivedPct: po.lines?.length
      ? Math.round((po.lines.reduce((s: number, l: any) => s + (l.receivedQty || 0), 0) /
          Math.max(1, po.lines.reduce((s: number, l: any) => s + (l.approvedQty || 0), 0))) * 100)
      : 0,
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
    // New fields
    operationRequestsOpen,
    coffeeBreakRequestsOpen,
    receivingToday: receivingTodayCount,
    todayConsumption: {
      qty:   (todayConsumptionRaw[0]?.totalQty   ?? 0) as number,
      txns:  (todayConsumptionRaw[0]?.totalTxns  ?? 0) as number,
    },
    latestOperationRequests: shapedOpRequests,
    latestCoffeeBreakRequests: shapedCbRequests,
    latestReceiving: shapedReceiving,
    recentPurchaseOrders: shapedPOs,
    lowStockItemsList,
  };
}
