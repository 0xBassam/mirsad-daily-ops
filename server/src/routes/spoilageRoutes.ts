import { Router } from 'express';
import { getSpoilageRecords, createSpoilageRecord, getSpoilageAlerts, resolveSpoilageAlert } from '../controllers/spoilageController';

const router = Router();
router.get('/', getSpoilageRecords);
router.post('/', createSpoilageRecord);
export default router;

export { getSpoilageAlerts, resolveSpoilageAlert };
