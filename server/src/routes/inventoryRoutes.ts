import { Router } from 'express';
import { getFoodInventory, getMaterialsInventory, getMovements, createMovement } from '../controllers/inventoryController';

const router = Router();
router.get('/food', getFoodInventory);
router.get('/materials', getMaterialsInventory);
router.get('/movements', getMovements);
router.post('/movements', createMovement);

export default router;
