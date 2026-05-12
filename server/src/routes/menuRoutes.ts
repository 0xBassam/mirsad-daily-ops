import { Router } from 'express';
import { listMenus, createMenu, getMenu, updateMenu } from '../controllers/menuController';

const router = Router();

router.get('/',     listMenus);
router.post('/',    createMenu);
router.get('/:id',  getMenu);
router.put('/:id',  updateMenu);

export default router;
