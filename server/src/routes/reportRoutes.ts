import { Router } from 'express';
import {
  getReports,
  generateReport,
  exportFloorCheckPDF,
  exportFloorCheckExcel,
  exportInventoryExcel,
} from '../controllers/reportController';

const router = Router();
router.get('/', getReports);
router.post('/', generateReport);
router.get('/floor-check/:id/pdf', exportFloorCheckPDF);
router.get('/floor-check/:id/excel', exportFloorCheckExcel);
router.get('/inventory/:type/excel', exportInventoryExcel);

export default router;
