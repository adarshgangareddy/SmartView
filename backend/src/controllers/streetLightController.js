import { streetLightService } from '../services/streetLightService.js';
import { deviceService } from '../services/deviceService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const streetLightController = {
  async getTelemetry(req, res) {
    try {
      const { deviceId } = req.params;
      const device = await deviceService.getDeviceById(deviceId);

      if (!device) {
        return sendError(res, 'DEVICE_NOT_FOUND', `Device '${deviceId}' not found.`, 404);
      }

      const telemetry = await streetLightService.getLatestTelemetry(deviceId);
      return sendSuccess(res, {
        deviceId,
        telemetry: telemetry || {
          is_night: false,
          ambient_light: 'DAY',
          motion_zones: { zone1: false, zone2: false, zone3: false, zone4: false },
          led_brightness: { led1: 0, led2: 0, led3: 0, led4: 0 },
          mode: device.mode,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      logger.error('Error fetching street light telemetry:', err.message);
      return sendError(res, 'TELEMETRY_ERROR', 'Failed to retrieve telemetry data.', 500);
    }
  },

  async controlLight(req, res) {
    try {
      const { deviceId } = req.params;
      const { state } = req.body;

      if (!state || !['ON', 'OFF', 'DIM'].includes(state.toUpperCase())) {
        return sendError(res, 'INVALID_STATE', "State must be 'ON', 'OFF', or 'DIM'.", 400);
      }

      const requestedBy = req.user ? req.user.email : 'operator';
      const result = await streetLightService.setLightState(deviceId, state.toUpperCase(), requestedBy);

      return sendSuccess(res, result);
    } catch (err) {
      logger.error('Error controlling street light:', err.message);
      return sendError(res, 'COMMAND_FAILED', err.message || 'Failed to send street light command.', 500);
    }
  },

  async setMode(req, res) {
    try {
      const { deviceId } = req.params;
      const { mode } = req.body;

      if (!mode || !['AUTO', 'MANUAL'].includes(mode.toUpperCase())) {
        return sendError(res, 'INVALID_MODE', "Mode must be 'AUTO' or 'MANUAL'.", 400);
      }

      const requestedBy = req.user ? req.user.email : 'operator';
      const result = await streetLightService.setMode(deviceId, mode.toUpperCase(), requestedBy);

      return sendSuccess(res, result);
    } catch (err) {
      logger.error('Error setting mode:', err.message);
      return sendError(res, 'MODE_ERROR', err.message || 'Failed to update operating mode.', 500);
    }
  },

  async setZone(req, res) {
    try {
      const { deviceId } = req.params;
      const { zone, brightness } = req.body;

      const zoneNum = parseInt(zone, 10);
      const brightNum = parseInt(brightness, 10);

      if (isNaN(zoneNum) || zoneNum < 1 || zoneNum > 4) {
        return sendError(res, 'INVALID_ZONE', 'Zone must be between 1 and 4.', 400);
      }

      if (isNaN(brightNum) || brightNum < 0 || brightNum > 255) {
        return sendError(res, 'INVALID_BRIGHTNESS', 'Brightness must be between 0 and 255.', 400);
      }

      const requestedBy = req.user ? req.user.email : 'operator';
      const result = await streetLightService.setZoneBrightness(deviceId, zoneNum, brightNum, requestedBy);

      return sendSuccess(res, result);
    } catch (err) {
      logger.error('Error setting zone brightness:', err.message);
      return sendError(res, 'ZONE_ERROR', err.message || 'Failed to update zone brightness.', 500);
    }
  },
};
