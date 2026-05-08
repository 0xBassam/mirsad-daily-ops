import { Router } from 'express';
import { getItemCategories, getItemCategory, createItemCategory, updateItemCategory, deleteItemCategory } from '../controllers/itemCategoryController';

const router = Router();
router.get('/', getItemCategories);
router.post('/', createItemCategory);
router.get('/:id', getItemCategory);
router.put('/:id', updateItemCategory);
router.delete('/:id', deleteItemCategory);

export default router;
