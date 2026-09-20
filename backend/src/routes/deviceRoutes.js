import express from 'express';
import { deviceController } from '../controllers/deviceController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', deviceController.getDevices);
router.get('/:deviceId', deviceController.getDevice);
router.get('/:deviceId/status', deviceController.getDeviceStatus);

export default router;
