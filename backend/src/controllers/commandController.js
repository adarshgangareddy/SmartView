import { v4 as uuidv4 } from 'uuid';
import { deviceService } from '../services/deviceService.js';
import { mqttService } from '../mqtt/mqttClient.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { DEVICE_STATUS, COMMAND_TYPES, EVENT_TYPES, DEVICE_MODE, GATE_STATUS } from '../utils/constants.js';

export const commandController = {
  async openGate(req, res) {
    try {
      const { deviceId } = req.params;

      const device = await deviceService.getDeviceById(deviceId);
      if (!device) {
        return sendError(res, 'DEVICE_NOT_FOUND', `Device '${deviceId}' not found.`, 404);
      }

      // Check device online status
      if (device.status !== DEVICE_STATUS.ONLINE) {
        return sendError(res, 'DEVICE_OFFLINE', 'The device is currently offline.', 400);
      }

      // Check if gate is already opening or open
      if (device.gate_status === GATE_STATUS.OPENING) {
        return sendError(res, 'GATE_BUSY', 'The gate is currently opening.', 400);
      }

      const requestId = uuidv4();
      const requestedBy = req.user ? req.user.email : 'operator';

      // 1. Record command in DB as SENT
      const commandRecord = await deviceService.createCommand(
        deviceId,
        COMMAND_TYPES.OPEN,
        requestedBy,
        { requestId }
      );

      // 2. Add audit log
      await deviceService.addDeviceLog(
        deviceId,
        EVENT_TYPES.COMMAND_SENT,
        `OPEN command sent by ${requestedBy}`,
        { requestId, command: 'OPEN' }
      );

      // 3. Publish to MQTT topic: gate/{deviceId}/command
      const payload = {
        command: 'OPEN',
        requestId,
        timestamp: new Date().toISOString(),
      };

      await mqttService.publishCommand(deviceId, payload);

      return sendSuccess(res, {
        commandId: commandRecord.id,
        requestId,
        deviceId,
        command: 'OPEN',
        status: 'SENT',
        message: 'Command sent. Awaiting device acknowledgement.',
      });
    } catch (err) {
      logger.error('Error in openGate command:', err.message);
      return sendError(res, 'COMMAND_FAILED', 'Gate command failed.', 500);
    }
  },

  async closeGate(req, res) {
    try {
      const { deviceId } = req.params;

      const device = await deviceService.getDeviceById(deviceId);
      if (!device) {
        return sendError(res, 'DEVICE_NOT_FOUND', `Device '${deviceId}' not found.`, 404);
      }

      if (device.status !== DEVICE_STATUS.ONLINE) {
        return sendError(res, 'DEVICE_OFFLINE', 'The device is currently offline.', 400);
      }

      if (device.gate_status === GATE_STATUS.CLOSING) {
        return sendError(res, 'GATE_BUSY', 'The gate is currently closing.', 400);
      }

      const requestId = uuidv4();
      const requestedBy = req.user ? req.user.email : 'operator';

      const commandRecord = await deviceService.createCommand(
        deviceId,
        COMMAND_TYPES.CLOSE,
        requestedBy,
        { requestId }
      );

      await deviceService.addDeviceLog(
        deviceId,
        EVENT_TYPES.COMMAND_SENT,
        `CLOSE command sent by ${requestedBy}`,
        { requestId, command: 'CLOSE' }
      );

      const payload = {
        command: 'CLOSE',
        requestId,
        timestamp: new Date().toISOString(),
      };

      await mqttService.publishCommand(deviceId, payload);

      return sendSuccess(res, {
        commandId: commandRecord.id,
        requestId,
        deviceId,
        command: 'CLOSE',
        status: 'SENT',
        message: 'Command sent. Awaiting device acknowledgement.',
      });
    } catch (err) {
      logger.error('Error in closeGate command:', err.message);
      return sendError(res, 'COMMAND_FAILED', 'Gate command failed.', 500);
    }
  },

  async setMode(req, res) {
    try {
      const { deviceId } = req.params;
      const { mode } = req.body;

      if (!mode || ![DEVICE_MODE.AUTO, DEVICE_MODE.MANUAL].includes(mode.toUpperCase())) {
        return sendError(res, 'INVALID_MODE', 'Mode must be either AUTO or MANUAL.', 400);
      }

      const normalizedMode = mode.toUpperCase();
      const device = await deviceService.getDeviceById(deviceId);
      if (!device) {
        return sendError(res, 'DEVICE_NOT_FOUND', `Device '${deviceId}' not found.`, 404);
      }

      const requestId = uuidv4();
      const requestedBy = req.user ? req.user.email : 'operator';

      // 1. Update DB
      await deviceService.updateDeviceStatus(deviceId, { mode: normalizedMode });

      // 2. Record command
      await deviceService.createCommand(deviceId, COMMAND_TYPES.SET_MODE, requestedBy, {
        mode: normalizedMode,
        requestId,
      });

      // 3. Log event
      await deviceService.addDeviceLog(
        deviceId,
        EVENT_TYPES.MODE_CHANGED,
        `Operating mode changed to ${normalizedMode} by ${requestedBy}`,
        { mode: normalizedMode, requestId }
      );

      // 4. Publish MQTT command
      const payload = {
        command: 'SET_MODE',
        mode: normalizedMode,
        requestId,
        timestamp: new Date().toISOString(),
      };

      try {
        await mqttService.publishCommand(deviceId, payload);
      } catch (mqttErr) {
        logger.warn('MQTT publish warning for mode change:', mqttErr.message);
      }

      return sendSuccess(res, {
        deviceId,
        mode: normalizedMode,
        message: `Gate mode updated to ${normalizedMode}`,
      });
    } catch (err) {
      logger.error('Error in setMode:', err.message);
      return sendError(res, 'MODE_UPDATE_FAILED', 'Failed to update operating mode.', 500);
    }
  },
};
