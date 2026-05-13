import { Router } from 'express';
import { getSettings, updateSettings, testEmail, getSubscription } from '../controllers/settingsController';
import { requireRole } from '../middleware/auth';

const router = Router();
router.get('/',            requireRole('admin'), getSettings);
router.put('/',            requireRole('admin'), updateSettings);
router.post('/test-email',   requireRole('admin'), testEmail);
router.get('/subscription',  requireRole('admin'), getSubscription);

export default router;
