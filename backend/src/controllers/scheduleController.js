import { scheduleService } from '../services/scheduleService.js';
import { deviceService } from '../services/deviceService.js';
import { mqttService } from '../mqtt/mqttClient.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { EVENT_TYPES, DAYS_OF_WEEK } from '../utils/constants.js';

export const scheduleController = {
  async getSchedule(req, res) {
    try {
      const { deviceId } = req.params;

      const device = await deviceService.getDeviceById(deviceId);
      if (!device) {
        return sendError(res, 'DEVICE_NOT_FOUND', `Device '${deviceId}' not found.`, 404);
      }

      const schedules = await scheduleService.getSchedulesByDevice(deviceId);
      return sendSuccess(res, { deviceId, schedules });
    } catch (err) {
      logger.error('Error in getSchedule:', err.message);
      return sendError(res, 'FETCH_SCHEDULE_FAILED', 'Failed to retrieve schedule.', 500);
    }
  },

  async updateSchedule(req, res) {
    try {
      const { deviceId } = req.params;
      const { day_of_week, open_time, close_time, enabled } = req.body;

      // 1. Verify device exists
      const device = await deviceService.getDeviceById(deviceId);
      if (!device) {
        return sendError(res, 'DEVICE_NOT_FOUND', `Device '${deviceId}' not found.`, 404);
      }

      // 2. Validate day of week
      if (!DAYS_OF_WEEK.map((d) => d.toLowerCase()).includes((day_of_week || '').toLowerCase())) {
        return sendError(
          res,
          'INVALID_DAY',
          `Day must be one of: ${DAYS_OF_WEEK.join(', ')}`,
          400
        );
      }

      // 3. Format/Validate times
      const validation = scheduleService.validateScheduleTimes(open_time, close_time);
      if (!validation.valid) {
        return sendError(res, 'INVALID_SCHEDULE_TIMES', validation.message, 400);
      }

      // Standardize day name capitalization
      const matchedDay = DAYS_OF_WEEK.find(
        (d) => d.toLowerCase() === day_of_week.toLowerCase()
      );

      // 4. Save to PostgreSQL
      const updatedSchedule = await scheduleService.updateSchedule(deviceId, {
        day_of_week: matchedDay,
        open_time: validation.openTime,
        close_time: validation.closeTime,
        enabled: enabled !== undefined ? Boolean(enabled) : true,
      });

      // 5. Create command audit record and device log
      const requestedBy = req.user ? req.user.email : 'operator';
      await deviceService.createCommand(deviceId, 'SET_SCHEDULE', requestedBy, {
        day_of_week: matchedDay,
        open_time: validation.openTime,
        close_time: validation.closeTime,
        enabled: updatedSchedule.enabled,
      });

      await deviceService.addDeviceLog(
        deviceId,
        EVENT_TYPES.SCHEDULE_UPDATED,
        `Schedule updated for ${matchedDay}: ${validation.openTime} → ${validation.closeTime} (${updatedSchedule.enabled ? 'Enabled' : 'Disabled'})`,
        { schedule: updatedSchedule, updatedBy: requestedBy }
      );

      // 6. Map day of week to numeric index (1 = Monday, 7 = Sunday) for ESP32
      const dayIndex = DAYS_OF_WEEK.indexOf(matchedDay) + 1;

      // 7. Publish updated configuration through MQTT
      const mqttPayload = {
        type: 'SCHEDULE_UPDATE',
        deviceId,
        dayOfWeek: dayIndex,
        dayName: matchedDay,
        openTime: validation.openTime.substring(0, 5), // '08:00'
        closeTime: validation.closeTime.substring(0, 5), // '20:00'
        enabled: updatedSchedule.enabled,
        timestamp: new Date().toISOString(),
      };

      try {
        await mqttService.publishScheduleConfig(deviceId, mqttPayload);
      } catch (mqttErr) {
        logger.warn(`MQTT publish error for schedule update:`, mqttErr.message);
      }

      return sendSuccess(res, {
        schedule: updatedSchedule,
        message: 'Schedule successfully updated and transmitted to device.',
      });
    } catch (err) {
      logger.error('Error in updateSchedule:', err.message);
      return sendError(res, 'UPDATE_SCHEDULE_FAILED', err.message || 'Failed to update schedule.', 400);
    }
  },
};
