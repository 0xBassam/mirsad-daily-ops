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
import supplierRoutes from './supplierRoutes';
import batchRoutes, { getExpiryTracking } from './batchRoutes';
import spoilageRoutes, { getSpoilageAlerts, resolveSpoilageAlert } from './spoilageRoutes';
import purchaseOrderRoutes from './purchaseOrderRoutes';
import transferRoutes from './transferRoutes';
import receivingRoutes from './receivingRoutes';
import maintenanceRoutes from './maintenanceRoutes';
import clientRequestRoutes from './clientRequestRoutes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

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

// ── Phase 1 & 2: Starter + Professional features ──────────────────────────────
router.use('/suppliers', verifyJWT, supplierRoutes);
router.use('/batches', verifyJWT, batchRoutes);
router.get('/expiry-tracking', verifyJWT, getExpiryTracking);
router.use('/spoilage', verifyJWT, spoilageRoutes);
router.get('/spoilage-alerts', verifyJWT, getSpoilageAlerts);
router.put('/spoilage-alerts/:id/resolve', verifyJWT, resolveSpoilageAlert);
router.use('/purchase-orders', verifyJWT, purchaseOrderRoutes);
router.use('/transfers',        verifyJWT, transferRoutes);
router.use('/receiving',        verifyJWT, receivingRoutes);
router.use('/maintenance',      verifyJWT, maintenanceRoutes);
router.use('/client-requests',  verifyJWT, clientRequestRoutes);

export default router;
