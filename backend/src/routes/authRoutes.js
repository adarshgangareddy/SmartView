import express from 'express';
import { authController } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { z } from 'zod';

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticateToken, authController.getMe);

export default router;
