import { Router } from 'express';
import { signup, login, checkAuth, logout } from '../controllers/authController.js';
import { protectedRoutes } from '@/middlewares/authMiddleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', protectedRoutes, logout);
router.get('/checkAuth', protectedRoutes ,checkAuth);

export default router;