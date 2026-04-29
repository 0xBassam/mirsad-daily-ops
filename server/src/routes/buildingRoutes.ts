import { Router } from 'express';
import { getBuildings, getBuilding, createBuilding, updateBuilding, deleteBuilding } from '../controllers/buildingController';

const router = Router();
router.get('/', getBuildings);
router.post('/', createBuilding);
router.get('/:id', getBuilding);
router.put('/:id', updateBuilding);
router.delete('/:id', deleteBuilding);

export default router;
