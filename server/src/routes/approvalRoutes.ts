import { Router } from 'express';
import { processApproval, getApprovals } from '../controllers/approvalController';

const router = Router();
router.get('/', getApprovals);
router.post('/:entityType/:entityId/:action', processApproval);

export default router;
