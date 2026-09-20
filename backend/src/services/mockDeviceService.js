import { logger } from '../utils/logger.js';
import { deviceService } from './deviceService.js';
import { GATE_STATUS, EVENT_TYPES, DEVICE_MODE, DEVICE_STATUS } from '../utils/constants.js';

class MockDeviceSimulator {
  constructor() {
    this.deviceId = process.env.DEVICE_ID || 'GATE-001';
    this.isEnabled = process.env.MOCK_DEVICE === 'true' || !process.env.MQTT_BROKER_URL;
    this.heartbeatTimer = null;
    this.currentStatus = {
      gateStatus: GATE_STATUS.CLOSED,
      mode: DEVICE_MODE.AUTO,
      status: DEVICE_STATUS.ONLINE,
      firmwareVersion: '1.0.0',
    };
    this.isTransitioning = false;
  }

  start() {
    if (!this.isEnabled) {
      logger.info('Mock Device Simulator is disabled (MOCK_DEVICE != true)');
      return;
    }

    logger.info(`[MOCK DEVICE] Starting Virtual ESP32 Simulator for ${this.deviceId}...`);

    // Initialize online state
    deviceService.updateDeviceStatus(this.deviceId, {
      status: DEVICE_STATUS.ONLINE,
      gate_status: this.currentStatus.gateStatus,
      mode: this.currentStatus.mode,
      firmware_version: this.currentStatus.firmwareVersion,
      last_seen: new Date().toISOString(),
    }).catch((err) => logger.error('Mock device init error:', err.message));

    // Send periodic heartbeat every 30 seconds
    this.heartbeatTimer = setInterval(async () => {
      try {
        await deviceService.updateDeviceStatus(this.deviceId, {
          status: DEVICE_STATUS.ONLINE,
          last_seen: new Date().toISOString(),
        });
        logger.debug(`[MOCK DEVICE] Heartbeat tick for ${this.deviceId}`);
      } catch (err) {
        logger.error('[MOCK DEVICE] Heartbeat error:', err.message);
      }
    }, 30000);
  }

  stop() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  async handleCommand(command, requestId) {
    if (!this.isEnabled) return;

    logger.info(`[MOCK DEVICE] Received command: ${command} (reqId: ${requestId})`);

    // 1. Immediately send acknowledgement
    await deviceService.acknowledgeCommand(this.deviceId, requestId, {
      simulated: true,
      ackTime: new Date().toISOString(),
    });

    await deviceService.addDeviceLog(
      this.deviceId,
      EVENT_TYPES.COMMAND_ACKNOWLEDGED,
      `Device acknowledged ${command} command`,
      { requestId }
    );

    // 2. Handle Gate Movements
    if (command === 'OPEN') {
      if (this.currentStatus.gateStatus === GATE_STATUS.OPEN) {
        logger.info('[MOCK DEVICE] Gate is already OPEN, ignoring physical motor move');
        return;
      }

      this.isTransitioning = true;
      this.currentStatus.gateStatus = GATE_STATUS.OPENING;
      await deviceService.updateDeviceStatus(this.deviceId, {
        gate_status: GATE_STATUS.OPENING,
        last_seen: new Date().toISOString(),
      });
      await deviceService.addDeviceLog(this.deviceId, EVENT_TYPES.GATE_OPENING, 'Gate motor started: Opening in progress...');

      // Simulate physical travel duration (3 seconds)
      setTimeout(async () => {
        this.currentStatus.gateStatus = GATE_STATUS.OPEN;
        this.isTransitioning = false;
        await deviceService.updateDeviceStatus(this.deviceId, {
          gate_status: GATE_STATUS.OPEN,
          last_seen: new Date().toISOString(),
        });
        await deviceService.addDeviceLog(this.deviceId, EVENT_TYPES.GATE_OPENED, 'Gate fully OPENED (Limit switch triggered)');
        logger.info('[MOCK DEVICE] Gate reached OPEN position');
      }, 3000);
    } else if (command === 'CLOSE') {
      if (this.currentStatus.gateStatus === GATE_STATUS.CLOSED) {
        logger.info('[MOCK DEVICE] Gate is already CLOSED, ignoring physical motor move');
        return;
      }

      this.isTransitioning = true;
      this.currentStatus.gateStatus = GATE_STATUS.CLOSING;
      await deviceService.updateDeviceStatus(this.deviceId, {
        gate_status: GATE_STATUS.CLOSING,
        last_seen: new Date().toISOString(),
      });
      await deviceService.addDeviceLog(this.deviceId, EVENT_TYPES.GATE_CLOSING, 'Gate motor started: Closing in progress...');

      // Simulate physical travel duration (3 seconds)
      setTimeout(async () => {
        this.currentStatus.gateStatus = GATE_STATUS.CLOSED;
        this.isTransitioning = false;
        await deviceService.updateDeviceStatus(this.deviceId, {
          gate_status: GATE_STATUS.CLOSED,
          last_seen: new Date().toISOString(),
        });
        await deviceService.addDeviceLog(this.deviceId, EVENT_TYPES.GATE_CLOSED, 'Gate fully CLOSED (Limit switch triggered)');
        logger.info('[MOCK DEVICE] Gate reached CLOSED position');
      }, 3000);
    } else if (command === 'SET_MODE') {
      // Handled via setMode
    }
  }

  async handleModeChange(mode) {
    if (!this.isEnabled) return;
    this.currentStatus.mode = mode;
    await deviceService.updateDeviceStatus(this.deviceId, {
      mode,
      last_seen: new Date().toISOString(),
    });
    await deviceService.addDeviceLog(this.deviceId, EVENT_TYPES.MODE_CHANGED, `Gate operating mode switched to ${mode}`);
    logger.info(`[MOCK DEVICE] Operating mode updated to ${mode}`);
  }

  async handleScheduleUpdate(scheduleData) {
    if (!this.isEnabled) return;
    await deviceService.addDeviceLog(
      this.deviceId,
      EVENT_TYPES.SCHEDULE_UPDATED,
      `ESP32 stored schedule update in NVS flash memory for ${scheduleData.day_of_week}`,
      { scheduleData }
    );
    logger.info(`[MOCK DEVICE] Saved schedule for ${scheduleData.day_of_week} in simulated NVS memory`);
  }
}

export const mockDeviceSimulator = new MockDeviceSimulator();
