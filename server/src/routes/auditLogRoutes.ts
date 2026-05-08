import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { requireRole } from '../middleware/auth';

const router = Router();
router.get('/', requireRole('admin'), getAuditLogs);

export default router;
