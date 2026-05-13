import { Router } from 'express';
import {
  getStats,
  getOrganizations,
  getOrganization,
  updateOrgPlan,
  suspendOrg,
  reactivateOrg,
  updateFeatureFlags,
} from '../controllers/superAdminController';

const router = Router();

router.get('/stats',                          getStats);
router.get('/organizations',                  getOrganizations);
router.get('/organizations/:id',              getOrganization);
router.patch('/organizations/:id/plan',       updateOrgPlan);
router.patch('/organizations/:id/suspend',    suspendOrg);
router.patch('/organizations/:id/reactivate', reactivateOrg);
router.patch('/organizations/:id/feature-flags', updateFeatureFlags);

export default router;
