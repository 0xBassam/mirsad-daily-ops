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

export default router;
