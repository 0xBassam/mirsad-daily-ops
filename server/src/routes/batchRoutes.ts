import { Router } from 'express';
import { getBatches, getBatch, createBatch, updateBatch, getExpiryTracking } from '../controllers/batchController';

const router = Router();
router.get('/', getBatches);
router.post('/', createBatch);
router.get('/:id', getBatch);
router.put('/:id', updateBatch);
export default router;

export { getExpiryTracking };
