import { Router } from 'express';
import { getFridgeChecks, getFridgeCheckById, createFridgeCheck } from '../controllers/fridgeCheckController';

const router = Router();

router.route('/').get(getFridgeChecks).post(createFridgeCheck);
router.route('/:id').get(getFridgeCheckById);

export default router;
