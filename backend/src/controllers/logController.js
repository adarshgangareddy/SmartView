import { deviceService } from '../services/deviceService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const logController = {
  async getDeviceLogs(req, res) {
    try {
      const { deviceId } = req.params;
      const limit = parseInt(req.query.limit || '50', 10);

      const device = await deviceService.getDeviceById(deviceId);
      if (!device) {
        return sendError(res, 'DEVICE_NOT_FOUND', `Device '${deviceId}' not found.`, 404);
      }

      const logs = await deviceService.getDeviceLogs(deviceId, limit);
      return sendSuccess(res, { deviceId, logs });
    } catch (err) {
      logger.error('Error fetching logs:', err.message);
      return sendError(res, 'FETCH_LOGS_FAILED', 'Failed to retrieve device logs.', 500);
    }
  },
};
