import express from 'express';
import { streetLightController } from '../controllers/streetLightController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { commandLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticateToken);

// Telemetry
router.get('/:deviceId/telemetry', streetLightController.getTelemetry);

// Commands
router.post('/:deviceId/commands/light', commandLimiter, streetLightController.controlLight);
router.post('/:deviceId/commands/light-mode', streetLightController.setMode);
router.post('/:deviceId/commands/zone', commandLimiter, streetLightController.setZone);

export default router;
