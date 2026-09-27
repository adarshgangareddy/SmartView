import { deviceService } from '../services/deviceService.js';
import { streetLightService } from '../services/streetLightService.js';
import { realtimeService } from '../services/realtimeService.js';
import { parseTopic } from './topics.js';
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

    const parsed = parseTopic(topic);
    if (!parsed) {
      return;
    }

    const { deviceId, type: messageType } = parsed;
    logger.debug(`Processing MQTT ${messageType} for ${deviceId}:`, payload);

    switch (messageType) {
      case 'status': {
        const isOnline = payload.online !== undefined ? (payload.online ? DEVICE_STATUS.ONLINE : DEVICE_STATUS.OFFLINE) : DEVICE_STATUS.ONLINE;
        const updates = {
          status: isOnline,
          gate_status: payload.gateStatus,
          light_status: payload.lightStatus,
          mode: payload.mode,
          firmware_version: payload.firmwareVersion,
          last_seen: payload.timestamp || new Date().toISOString(),
        };

        const updatedDevice = await deviceService.updateDeviceStatus(deviceId, updates);

        // Broadcast to WebSocket clients
        realtimeService.broadcast('DEVICE_STATUS', {
          deviceId,
          device: updatedDevice,
          payload,
        });

        if (payload.gateStatus) {
          await deviceService.addDeviceLog(
            deviceId,
            `GATE_${payload.gateStatus}`,
            `Device reported gate status: ${payload.gateStatus}`,
            payload
          );
        } else if (payload.lightStatus) {
          await deviceService.addDeviceLog(
            deviceId,
            `LIGHT_${payload.lightStatus}`,
            `Street light reported state: ${payload.lightStatus}`,
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

          // Broadcast ACK to WebSocket clients
          realtimeService.broadcast('COMMAND_ACK', {
            deviceId,
            requestId,
            command: payload.command,
            status: 'ACKNOWLEDGED',
            payload,
          });
        }
        break;
      }

      case 'heartbeat': {
        await deviceService.updateDeviceStatus(deviceId, {
          status: DEVICE_STATUS.ONLINE,
          gate_status: payload.gateStatus,
          light_status: payload.lightStatus,
          last_seen: payload.timestamp || new Date().toISOString(),
        });

        // Broadcast alive heartbeat
        realtimeService.broadcast('HEARTBEAT', {
          deviceId,
          timestamp: payload.timestamp || new Date().toISOString(),
          status: DEVICE_STATUS.ONLINE,
        });
        break;
      }

      case 'telemetry': {
        // If street light telemetry
        if (
          payload.motionZones !== undefined ||
          payload.motion_zones !== undefined ||
          payload.isNight !== undefined ||
          payload.is_night !== undefined ||
          deviceId.includes('STREETLIGHT')
        ) {
          await streetLightService.recordTelemetry(deviceId, payload);
        } else {
          // Gate telemetry
          await deviceService.addDeviceLog(
            deviceId,
            EVENT_TYPES.TELEMETRY,
            `Device telemetry: RSSI ${payload.rssi || '--'}dBm, Heap ${payload.freeHeap || '--'}B`,
            payload
          );
        }
        break;
      }

      default:
        logger.debug(`Unhandled MQTT message type: ${messageType}`);
    }
  } catch (err) {
    logger.error(`Error in handleMqttMessage for ${topic}:`, err.message);
  }
};
