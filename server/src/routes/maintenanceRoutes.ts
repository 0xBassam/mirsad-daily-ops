import { Router } from 'express';
import {
  getMaintenanceRequests, getMaintenanceRequest,
  createMaintenanceRequest, updateMaintenanceRequest,
  assignMaintenanceRequest, startMaintenanceRequest,
  resolveMaintenanceRequest, closeMaintenanceRequest,
} from '../controllers/maintenanceController';

const router = Router();
router.get('/',                    getMaintenanceRequests);
router.post('/',                   createMaintenanceRequest);
router.get('/:id',                 getMaintenanceRequest);
router.put('/:id',                 updateMaintenanceRequest);
router.post('/:id/assign',         assignMaintenanceRequest);
router.post('/:id/start',          startMaintenanceRequest);
router.post('/:id/resolve',        resolveMaintenanceRequest);
router.post('/:id/close',          closeMaintenanceRequest);

export default router;
