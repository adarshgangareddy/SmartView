import express from 'express';
import { logController } from '../controllers/logController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/:deviceId/logs', logController.getDeviceLogs);

export default router;
