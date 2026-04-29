import { Router } from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/userController';
import { requireRole } from '../middleware/auth';

const router = Router();
router.get('/', requireRole('admin'), getUsers);
router.post('/', requireRole('admin'), createUser);
router.get('/:id', requireRole('admin'), getUser);
router.put('/:id', requireRole('admin'), updateUser);
router.delete('/:id', requireRole('admin'), deleteUser);

export default router;
