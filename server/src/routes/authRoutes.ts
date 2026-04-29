import { Router } from 'express';
import { login, logout, getMe } from '../controllers/authController';
import { verifyJWT } from '../middleware/auth';

const router = Router();
router.post('/login', login);
router.post('/logout', verifyJWT, logout);
router.get('/me', verifyJWT, getMe);

export default router;
