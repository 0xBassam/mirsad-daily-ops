import { Router } from 'express';
import { getSettings, updateSettings, testEmail } from '../controllers/settingsController';
import { requireRole } from '../middleware/auth';

const router = Router();
router.get('/',            requireRole('admin'), getSettings);
router.put('/',            requireRole('admin'), updateSettings);
router.post('/test-email', requireRole('admin'), testEmail);

export default router;
