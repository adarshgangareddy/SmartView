import { deviceService } from '../services/deviceService.js';
import { logger } from '../utils/logger.js';
import { EVENT_TYPES, DEVICE_STATUS } from '../utils/constants.js';

export const handleMqttMessage = async (topic, payloadString) => {
  try {
    let payload;
    try {
      payload = JSON.parse(payloadString);
    } catch {
      payload = { raw: payloadString };
    }

    const parts = topic.split('/');
    if (parts.length < 3 || parts[0] !== 'gate') {
      return;
    }

    const deviceId = parts[1];
    const messageType = parts[2];

    logger.debug(`Processing MQTT ${messageType} for ${deviceId}:`, payload);

    switch (messageType) {
      case 'status': {
        const isOnline = payload.online !== undefined ? (payload.online ? DEVICE_STATUS.ONLINE : DEVICE_STATUS.OFFLINE) : DEVICE_STATUS.ONLINE;
        await deviceService.updateDeviceStatus(deviceId, {
          status: isOnline,
          gate_status: payload.gateStatus,
          mode: payload.mode,
          firmware_version: payload.firmwareVersion,
          last_seen: payload.timestamp || new Date().toISOString(),
        });

        if (payload.gateStatus) {
          await deviceService.addDeviceLog(
            deviceId,
            `GATE_${payload.gateStatus}`,
            `Device reported gate status: ${payload.gateStatus}`,
            payload
          );
        }
        break;
      }

      case 'ack': {
        const requestId = payload.requestId;
        if (requestId) {
          await deviceService.acknowledgeCommand(deviceId, requestId, payload);
          await deviceService.addDeviceLog(
            deviceId,
            EVENT_TYPES.COMMAND_ACKNOWLEDGED,
            `Device acknowledged command ${payload.command || ''} (requestId: ${requestId})`,
            payload
          );
        }
        break;
      }

      case 'heartbeat': {
        await deviceService.updateDeviceStatus(deviceId, {
          status: DEVICE_STATUS.ONLINE,
          gate_status: payload.gateStatus,
          last_seen: payload.timestamp || new Date().toISOString(),
        });
        break;
      }

      case 'telemetry': {
        await deviceService.addDeviceLog(
          deviceId,
          'TELEMETRY',
          `Device telemetry: RSSI ${payload.rssi}dBm, Heap ${payload.freeHeap}B, Uptime ${payload.uptime}s`,
          payload
        );
        break;
      }

      default:
        logger.debug(`Unhandled MQTT message type: ${messageType}`);
    }
  } catch (err) {
    logger.error(`Error in handleMqttMessage for ${topic}:`, err.message);
  }
};
