import { Router } from 'express';
import { login, logout, getMe, signup } from '../controllers/authController';
import { verifyJWT } from '../middleware/auth';

const router = Router();
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', verifyJWT, logout);
router.get('/me', verifyJWT, getMe);

export default router;
