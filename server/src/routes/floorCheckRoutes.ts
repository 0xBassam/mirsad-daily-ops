import { Router } from 'express';
import {
  getFloorChecks,
  getFloorCheck,
  createFloorCheck,
  updateFloorCheck,
  submitFloorCheck,
  deleteFloorCheck,
} from '../controllers/floorCheckController';

const router = Router();
router.get('/', getFloorChecks);
router.post('/', createFloorCheck);
router.get('/:id', getFloorCheck);
router.put('/:id', updateFloorCheck);
router.post('/:id/submit', submitFloorCheck);
router.delete('/:id', deleteFloorCheck);

export default router;
