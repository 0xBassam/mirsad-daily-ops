import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { logAction } from '../services/auditService';
import {
  exportOperationRequestsPDF,
  exportOperationRequestsExcel,
  exportCoffeeBreakRequestsPDF,
  exportCoffeeBreakRequestsExcel,
  exportReceivingPDF,
  exportReceivingExcel,
  exportPurchaseOrdersPDF,
  exportPurchaseOrdersExcel,
  exportLowStockPDF,
  exportLowStockExcel,
  exportAuditLogsPDF,
  exportAuditLogsExcel,
  exportSavedReportPDF,
  exportSavedReportExcel,
  exportTransfersPDF,
  exportTransfersExcel,
  exportDailyPlansPDF,
  exportDailyPlansExcel,
  exportFoodInventoryPDF,
  exportMaterialsInventoryPDF,
} from '../services/exportService';

function parseDateOpts(req: Request) {
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
  const dateTo   = req.query.dateTo   ? new Date(req.query.dateTo   as string) : undefined;
  const organizationId = req.organizationId as string;
  return { dateFrom, dateTo, organizationId };
}

export const exportOpRequestsPDF = asyncHandler(async (req: Request, res: Response) => {
  await exportOperationRequestsPDF(res, parseDateOpts(req));
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'operation_request', req });
});

export const exportOpRequestsExcel = asyncHandler(async (req: Request, res: Response) => {
  await exportOperationRequestsExcel(res, parseDateOpts(req));
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'operation_request', req });
});

export const exportCbRequestsPDF = asyncHandler(async (req: Request, res: Response) => {
  await exportCoffeeBreakRequestsPDF(res, parseDateOpts(req));
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'coffee_break_request', req });
});

export const exportCbRequestsExcel = asyncHandler(async (req: Request, res: Response) => {
  await exportCoffeeBreakRequestsExcel(res, parseDateOpts(req));
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'coffee_break_request', req });
});

export const exportReceivingRecordsPDF = asyncHandler(async (req: Request, res: Response) => {
  await exportReceivingPDF(res, parseDateOpts(req));
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'receiving', req });
});

export const exportReceivingRecordsExcel = asyncHandler(async (req: Request, res: Response) => {
  await exportReceivingExcel(res, parseDateOpts(req));
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'receiving', req });
});

export const exportPurchaseOrdersListPDF = asyncHandler(async (req: Request, res: Response) => {
  await exportPurchaseOrdersPDF(res, parseDateOpts(req));
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'purchase_order', req });
});

export const exportPurchaseOrdersListExcel = asyncHandler(async (req: Request, res: Response) => {
  await exportPurchaseOrdersExcel(res, parseDateOpts(req));
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'purchase_order', req });
});

export const exportLowStockListPDF = asyncHandler(async (req: Request, res: Response) => {
  const period = req.query.period as string | undefined;
  const organizationId = req.organizationId as string;
  await exportLowStockPDF(res, { period, organizationId });
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'inventory', req });
});

export const exportInventoryListExcel = asyncHandler(async (req: Request, res: Response) => {
  const period = req.query.period as string | undefined;
  const type   = (req.query.type as 'food' | 'material' | 'all') || 'all';
  const organizationId = req.organizationId as string;
  await exportLowStockExcel(res, { period, type, organizationId });
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'inventory', req });
});

export const exportAuditLogListPDF = asyncHandler(async (req: Request, res: Response) => {
  await exportAuditLogsPDF(res, parseDateOpts(req));
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'audit_log', req });
});

export const exportAuditLogListExcel = asyncHandler(async (req: Request, res: Response) => {
  await exportAuditLogsExcel(res, parseDateOpts(req));
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'audit_log', req });
});

export const exportReportPDF = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.organizationId as string;
  await exportSavedReportPDF(req.params.id, res, organizationId);
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'report', entityId: req.params.id, req });
});

export const exportReportExcel = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.organizationId as string;
  await exportSavedReportExcel(req.params.id, res, organizationId);
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'report', entityId: req.params.id, req });
});

export const exportTransfersListPDF = asyncHandler(async (req: Request, res: Response) => {
  await exportTransfersPDF(res, parseDateOpts(req));
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'transfer', req });
});

export const exportTransfersListExcel = asyncHandler(async (req: Request, res: Response) => {
  await exportTransfersExcel(res, parseDateOpts(req));
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'transfer', req });
});

export const exportDailyPlansListPDF = asyncHandler(async (req: Request, res: Response) => {
  await exportDailyPlansPDF(res, parseDateOpts(req));
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'daily_plan', req });
});

export const exportDailyPlansListExcel = asyncHandler(async (req: Request, res: Response) => {
  await exportDailyPlansExcel(res, parseDateOpts(req));
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'daily_plan', req });
});

export const exportFoodInventoryListPDF = asyncHandler(async (req: Request, res: Response) => {
  const period = req.query.period as string | undefined;
  const organizationId = req.organizationId as string;
  await exportFoodInventoryPDF(res, { period, organizationId });
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'inventory', req });
});

export const exportMaterialsInventoryListPDF = asyncHandler(async (req: Request, res: Response) => {
  const period = req.query.period as string | undefined;
  const organizationId = req.organizationId as string;
  await exportMaterialsInventoryPDF(res, { period, organizationId });
  await logAction({ userId: req.user?.userId, action: 'export', entityType: 'inventory', req });
});
