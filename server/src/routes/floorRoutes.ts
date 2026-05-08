import { Router } from 'express';
import { getFloors, getFloor, createFloor, updateFloor, deleteFloor } from '../controllers/floorController';

const router = Router();
router.get('/', getFloors);
router.post('/', createFloor);
router.get('/:id', getFloor);
router.put('/:id', updateFloor);
router.delete('/:id', deleteFloor);

export default router;
