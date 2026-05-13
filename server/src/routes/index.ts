import { Router } from 'express';
import { verifyJWT, requireRole, requireOrganization, requireSuperAdmin } from '../middleware/auth';
const ORG = requireOrganization;

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
import superAdminRoutes from './superAdminRoutes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

router.use('/auth', authRoutes);
// ── Role shorthand helpers ────────────────────────────────────────────────────
const ADMIN_PM     = requireRole('admin', 'project_manager');
const OPS_ROLES    = requireRole('admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'operations');
const PLAN_ROLES   = requireRole('admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'operations', 'kitchen');
const WH_ROLES     = requireRole('admin', 'project_manager', 'assistant_supervisor', 'warehouse');
const STOCK_ROLES  = requireRole('admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'operations', 'warehouse', 'kitchen');
const ALL_OPS      = requireRole('admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'operations', 'warehouse');
const CR_ROLES     = requireRole('admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'operations', 'client');
const RPT_ROLES    = requireRole('admin', 'project_manager', 'supervisor', 'operations', 'warehouse', 'client');

router.use('/users',      verifyJWT, ORG, requireRole('admin'), userRoutes);
router.use('/projects',   verifyJWT, ORG, ADMIN_PM, projectRoutes);
router.use('/buildings',  verifyJWT, ORG, ALL_OPS, buildingRoutes);
router.use('/floors',     verifyJWT, ORG, ALL_OPS, floorRoutes);
router.use('/categories', verifyJWT, ORG, ADMIN_PM, itemCategoryRoutes);
router.use('/items',      verifyJWT, ORG, ADMIN_PM, itemRoutes);
router.use('/daily-plans',   verifyJWT, ORG, PLAN_ROLES, dailyPlanRoutes);
router.use('/floor-checks',  verifyJWT, ORG, OPS_ROLES, floorCheckRoutes);
router.use('/approvals',     verifyJWT, ORG, requireRole('admin', 'assistant_supervisor', 'project_manager'), approvalRoutes);
router.use('/inventory',     verifyJWT, ORG, STOCK_ROLES, inventoryRoutes);
router.use('/attachments',   verifyJWT, ORG, attachmentRoutes);
router.use('/reports',       verifyJWT, ORG, RPT_ROLES, reportRoutes);
router.use('/audit-logs',    verifyJWT, ORG, requireRole('admin'), auditLogRoutes);
router.use('/dashboard',     verifyJWT, ORG, dashboardRoutes);

// ── Phase 1 & 2: Starter + Professional features ──────────────────────────────
router.use('/suppliers',     verifyJWT, ORG, WH_ROLES, supplierRoutes);
router.use('/batches',       verifyJWT, ORG, WH_ROLES, batchRoutes);
router.get('/expiry-tracking', verifyJWT, ORG, WH_ROLES, getExpiryTracking);
router.use('/spoilage',      verifyJWT, ORG, ALL_OPS, spoilageRoutes);
router.get('/spoilage-alerts',             verifyJWT, ORG, ALL_OPS, getSpoilageAlerts);
router.put('/spoilage-alerts/:id/resolve', verifyJWT, ORG, ALL_OPS, resolveSpoilageAlert);
router.use('/purchase-orders',   verifyJWT, ORG, WH_ROLES, purchaseOrderRoutes);
router.use('/transfers',         verifyJWT, ORG, WH_ROLES, transferRoutes);
router.use('/receiving',         verifyJWT, ORG, WH_ROLES, receivingRoutes);
router.use('/maintenance',       verifyJWT, ORG, OPS_ROLES, maintenanceRoutes);
router.use('/client-requests',   verifyJWT, ORG, CR_ROLES, clientRequestRoutes);
router.use('/fridge-checks',     verifyJWT, ORG, WH_ROLES, fridgeCheckRoutes);
router.use('/corrective-actions',verifyJWT, ORG, OPS_ROLES, correctiveActionRoutes);
router.use('/export',            verifyJWT, ORG, exportRoutes);
router.use('/menu',              verifyJWT, ORG, OPS_ROLES, menuRoutes);
router.use('/settings',          verifyJWT, ORG, requireRole('admin'), settingsRoutes);
router.use('/client-dashboard',  verifyJWT, ORG, requireRole('client'), clientDashboardRoutes);
router.use('/super-admin',       verifyJWT, requireSuperAdmin, superAdminRoutes);

export default router;
