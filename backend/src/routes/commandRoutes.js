import express from 'express';
import { commandController } from '../controllers/commandController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { commandLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { z } from 'zod';

const router = express.Router();

router.use(authenticateToken);

const modeSchema = z.object({
  mode: z.enum(['AUTO', 'MANUAL', 'auto', 'manual']),
});

router.post('/:deviceId/commands/open', commandLimiter, commandController.openGate);
router.post('/:deviceId/commands/close', commandLimiter, commandController.closeGate);
router.post('/:deviceId/commands/mode', validateBody(modeSchema), commandController.setMode);

export default router;
