import { Router } from 'express';
import { getItems, getItem, createItem, updateItem, deleteItem } from '../controllers/itemController';

const router = Router();
router.get('/', getItems);
router.post('/', createItem);
router.get('/:id', getItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
