import express from 'express';
import { scheduleController } from '../controllers/scheduleController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { z } from 'zod';

const router = express.Router();

const updateScheduleSchema = z.object({
  day_of_week: z.string().min(1, 'Day of week is required'),
  open_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Open time must be valid format HH:mm or HH:mm:ss'),
  close_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Close time must be valid format HH:mm or HH:mm:ss'),
  enabled: z.boolean().optional(),
});

router.use(authenticateToken);

router.get('/:deviceId/schedule', scheduleController.getSchedule);
router.put('/:deviceId/schedule', validateBody(updateScheduleSchema), scheduleController.updateSchedule);

export default router;
