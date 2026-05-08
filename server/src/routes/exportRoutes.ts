import { Router } from 'express';
import {
  exportOpRequestsPDF,
  exportOpRequestsExcel,
  exportCbRequestsPDF,
  exportCbRequestsExcel,
  exportReceivingRecordsPDF,
  exportReceivingRecordsExcel,
  exportPurchaseOrdersListPDF,
  exportPurchaseOrdersListExcel,
  exportLowStockListPDF,
  exportInventoryListExcel,
  exportAuditLogListPDF,
  exportAuditLogListExcel,
  exportReportPDF,
  exportReportExcel,
  exportTransfersListPDF,
  exportTransfersListExcel,
  exportDailyPlansListPDF,
  exportDailyPlansListExcel,
  exportFoodInventoryListPDF,
  exportMaterialsInventoryListPDF,
} from '../controllers/exportController';

const router = Router();

router.get('/operation-requests/pdf',   exportOpRequestsPDF);
router.get('/operation-requests/excel', exportOpRequestsExcel);
router.get('/coffee-break-requests/pdf',   exportCbRequestsPDF);
router.get('/coffee-break-requests/excel', exportCbRequestsExcel);
router.get('/receiving/pdf',   exportReceivingRecordsPDF);
router.get('/receiving/excel', exportReceivingRecordsExcel);
router.get('/purchase-orders/pdf',   exportPurchaseOrdersListPDF);
router.get('/purchase-orders/excel', exportPurchaseOrdersListExcel);
router.get('/low-stock/pdf',   exportLowStockListPDF);
router.get('/inventory/excel', exportInventoryListExcel);
router.get('/audit-logs/pdf',   exportAuditLogListPDF);
router.get('/audit-logs/excel', exportAuditLogListExcel);
router.get('/reports/:id/pdf',   exportReportPDF);
router.get('/reports/:id/excel', exportReportExcel);
router.get('/transfers/pdf',   exportTransfersListPDF);
router.get('/transfers/excel', exportTransfersListExcel);
router.get('/daily-plans/pdf',   exportDailyPlansListPDF);
router.get('/daily-plans/excel', exportDailyPlansListExcel);
router.get('/food-inventory/pdf',      exportFoodInventoryListPDF);
router.get('/materials-inventory/pdf', exportMaterialsInventoryListPDF);

export default router;
