import { Router } from 'express';
import { verifyJWT, requireRole } from '../middleware/auth';

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
import fridgeCheckRoutes from './fridgeCheckRoutes';
import correctiveActionRoutes from './correctiveActionRoutes';
import exportRoutes from './exportRoutes';
import menuRoutes from './menuRoutes';
import settingsRoutes from './settingsRoutes';
import clientDashboardRoutes from './clientDashboardRoutes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

router.use('/auth', authRoutes);
// ── Role shorthand helpers ────────────────────────────────────────────────────
const ADMIN_PM     = requireRole('admin', 'project_manager');
const OPS_ROLES    = requireRole('admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'operations');
const WH_ROLES     = requireRole('admin', 'project_manager', 'assistant_supervisor', 'warehouse');
const STOCK_ROLES  = requireRole('admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'operations', 'warehouse', 'kitchen');
const ALL_OPS      = requireRole('admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'operations', 'warehouse');
const CR_ROLES     = requireRole('admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'operations', 'client');
const RPT_ROLES    = requireRole('admin', 'project_manager', 'supervisor', 'operations', 'warehouse', 'client');

router.use('/users',      verifyJWT, requireRole('admin'), userRoutes);
router.use('/projects',   verifyJWT, ADMIN_PM, projectRoutes);
router.use('/buildings',  verifyJWT, ALL_OPS, buildingRoutes);
router.use('/floors',     verifyJWT, ALL_OPS, floorRoutes);
router.use('/categories', verifyJWT, ADMIN_PM, itemCategoryRoutes);
router.use('/items',      verifyJWT, ADMIN_PM, itemRoutes);
router.use('/daily-plans',   verifyJWT, OPS_ROLES, dailyPlanRoutes);
router.use('/floor-checks',  verifyJWT, OPS_ROLES, floorCheckRoutes);
router.use('/approvals',     verifyJWT, requireRole('admin', 'assistant_supervisor', 'project_manager'), approvalRoutes);
router.use('/inventory',     verifyJWT, STOCK_ROLES, inventoryRoutes);
router.use('/attachments',   verifyJWT, attachmentRoutes);
router.use('/reports',       verifyJWT, RPT_ROLES, reportRoutes);
router.use('/audit-logs',    verifyJWT, requireRole('admin'), auditLogRoutes);
router.use('/dashboard',     verifyJWT, dashboardRoutes);

// ── Phase 1 & 2: Starter + Professional features ──────────────────────────────
router.use('/suppliers',     verifyJWT, WH_ROLES, supplierRoutes);
router.use('/batches',       verifyJWT, WH_ROLES, batchRoutes);
router.get('/expiry-tracking', verifyJWT, WH_ROLES, getExpiryTracking);
router.use('/spoilage',      verifyJWT, ALL_OPS, spoilageRoutes);
router.get('/spoilage-alerts',             verifyJWT, ALL_OPS, getSpoilageAlerts);
router.put('/spoilage-alerts/:id/resolve', verifyJWT, ALL_OPS, resolveSpoilageAlert);
router.use('/purchase-orders',   verifyJWT, WH_ROLES, purchaseOrderRoutes);
router.use('/transfers',         verifyJWT, WH_ROLES, transferRoutes);
router.use('/receiving',         verifyJWT, WH_ROLES, receivingRoutes);
router.use('/maintenance',       verifyJWT, OPS_ROLES, maintenanceRoutes);
router.use('/client-requests',   verifyJWT, CR_ROLES, clientRequestRoutes);
router.use('/fridge-checks',     verifyJWT, WH_ROLES, fridgeCheckRoutes);
router.use('/corrective-actions',verifyJWT, OPS_ROLES, correctiveActionRoutes);
router.use('/export',            verifyJWT, exportRoutes);
router.use('/menu',              verifyJWT, OPS_ROLES, menuRoutes);
router.use('/settings',          verifyJWT, requireRole('admin'), settingsRoutes);
router.use('/client-dashboard',  verifyJWT, requireRole('client'), clientDashboardRoutes);

export default router;
