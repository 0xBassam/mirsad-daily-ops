import { Router } from 'express';
import { verifyJWT } from '../middleware/auth';

import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import projectRoutes from './projectRoutes';
import buildingRoutes from './buildingRoutes';
import floorRoutes from './floorRoutes';
import itemCategoryRoutes from './itemCategoryRoutes';
import itemRoutes from './itemRoutes';
import dailyPlanRoutes from './dailyPlanRoutes';
import floorCheckRoutes from './floorCheckRoutes';
import approvalRoutes from './approvalRoutes';
import inventoryRoutes from './inventoryRoutes';
import attachmentRoutes from './attachmentRoutes';
import reportRoutes from './reportRoutes';
import auditLogRoutes from './auditLogRoutes';
import dashboardRoutes from './dashboardRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', verifyJWT, userRoutes);
router.use('/projects', verifyJWT, projectRoutes);
router.use('/buildings', verifyJWT, buildingRoutes);
router.use('/floors', verifyJWT, floorRoutes);
router.use('/categories', verifyJWT, itemCategoryRoutes);
router.use('/items', verifyJWT, itemRoutes);
router.use('/daily-plans', verifyJWT, dailyPlanRoutes);
router.use('/floor-checks', verifyJWT, floorCheckRoutes);
router.use('/approvals', verifyJWT, approvalRoutes);
router.use('/inventory', verifyJWT, inventoryRoutes);
router.use('/attachments', verifyJWT, attachmentRoutes);
router.use('/reports', verifyJWT, reportRoutes);
router.use('/audit-logs', verifyJWT, auditLogRoutes);
router.use('/dashboard', verifyJWT, dashboardRoutes);

export default router;
