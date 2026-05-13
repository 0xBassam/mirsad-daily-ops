import { Router } from 'express';
import { getClientDashboard } from '../controllers/clientDashboardController';

const router = Router();
router.get('/', getClientDashboard);

export default router;
