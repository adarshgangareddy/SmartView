import { deviceService } from '../services/deviceService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const deviceController = {
  async getDevices(req, res) {
    try {
      const devices = await deviceService.getAllDevices();
      return sendSuccess(res, { devices });
    } catch (err) {
      logger.error('Error in getDevices:', err.message);
      return sendError(res, 'FETCH_DEVICES_FAILED', 'Failed to retrieve devices.', 500);
    }
  },

  async getDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const device = await deviceService.getDeviceById(deviceId);

      if (!device) {
        return sendError(res, 'DEVICE_NOT_FOUND', `Device '${deviceId}' was not found.`, 404);
      }

      return sendSuccess(res, { device });
    } catch (err) {
      logger.error('Error in getDevice:', err.message);
      return sendError(res, 'FETCH_DEVICE_FAILED', 'Failed to retrieve device details.', 500);
    }
  },

  async getDeviceStatus(req, res) {
    try {
      const { deviceId } = req.params;
      const device = await deviceService.getDeviceById(deviceId);

      if (!device) {
        return sendError(res, 'DEVICE_NOT_FOUND', `Device '${deviceId}' was not found.`, 404);
      }

      return sendSuccess(res, {
        deviceId: device.device_id,
        name: device.name,
        status: device.status,
        gateStatus: device.gate_status,
        mode: device.mode,
        lastSeen: device.last_seen,
        firmwareVersion: device.firmware_version,
      });
    } catch (err) {
      logger.error('Error in getDeviceStatus:', err.message);
      return sendError(res, 'FETCH_STATUS_FAILED', 'Failed to retrieve device status.', 500);
    }
  },
};
