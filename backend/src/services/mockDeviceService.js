import { logger } from '../utils/logger.js';
import { deviceService } from './deviceService.js';
import { realtimeService } from './realtimeService.js';
import { GATE_STATUS, EVENT_TYPES, DEVICE_MODE, DEVICE_STATUS, LIGHT_STATUS } from '../utils/constants.js';

class MockDeviceSimulator {
  constructor() {
    this.isEnabled = process.env.MOCK_DEVICE === 'true' || !process.env.MQTT_BROKER_URL;
    this.heartbeatTimer = null;

    // Gate simulated state
    this.gateState = {
      deviceId: 'GATE-001',
      gateStatus: GATE_STATUS.CLOSED,
      mode: DEVICE_MODE.AUTO,
      status: DEVICE_STATUS.ONLINE,
      firmwareVersion: '1.0.0',
    };

    // Street light simulated state
    this.streetLightState = {
      deviceId: 'STREETLIGHT-001',
      lightStatus: LIGHT_STATUS.ADAPTIVE,
      mode: DEVICE_MODE.AUTO,
      status: DEVICE_STATUS.ONLINE,
      isNight: true,
      ambientLight: 'NIGHT',
      motionZones: { zone1: false, zone2: false, zone3: false, zone4: false },
      ledBrightness: { led1: 60, led2: 60, led3: 60, led4: 60 },
      firmwareVersion: '1.0.0',
    };
  }

  start() {
    if (!this.isEnabled) {
      logger.info('Mock Device Simulator is disabled (MOCK_DEVICE != true)');
      return;
    }

    logger.info(`[MOCK DEVICE] Starting Virtual Simulator for SmartView (GATE-001 & STREETLIGHT-001)...`);

    // Initialize online states
    deviceService.updateDeviceStatus('GATE-001', {
      status: DEVICE_STATUS.ONLINE,
      gate_status: this.gateState.gateStatus,
      mode: this.gateState.mode,
      last_seen: new Date().toISOString(),
    }).catch((err) => logger.error('Gate mock init error:', err.message));

    deviceService.updateDeviceStatus('STREETLIGHT-001', {
      status: DEVICE_STATUS.ONLINE,
      light_status: this.streetLightState.lightStatus,
      mode: this.streetLightState.mode,
      last_seen: new Date().toISOString(),
    }).catch((err) => logger.error('Streetlight mock init error:', err.message));

    // Send periodic heartbeats every 30s
    this.heartbeatTimer = setInterval(async () => {
      try {
        const now = new Date().toISOString();
        await deviceService.updateDeviceStatus('GATE-001', {
          status: DEVICE_STATUS.ONLINE,
          last_seen: now,
        });
        await deviceService.updateDeviceStatus('STREETLIGHT-001', {
          status: DEVICE_STATUS.ONLINE,
          last_seen: now,
        });

        realtimeService.broadcast('HEARTBEAT', {
          deviceId: 'STREETLIGHT-001',
          timestamp: now,
          status: DEVICE_STATUS.ONLINE,
        });
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

  async handleDeviceCommand(deviceId, commandPayload) {
    if (!this.isEnabled) return;

    if (deviceId.startsWith('GATE')) {
      return this.handleGateCommand(commandPayload.command, commandPayload.requestId);
    } else if (deviceId.startsWith('STREETLIGHT')) {
      return this.handleStreetLightCommand(commandPayload);
    } else if (deviceId.startsWith('LED')) {
      return this.handleSingleLedCommand(commandPayload);
    }
  }

  // Single LED command simulation
  async handleSingleLedCommand(payload) {
    const { command, requestId, state } = payload;
    logger.info(`[MOCK DEVICE] Received SINGLE LED command: ${command}`, payload);
    const now = new Date().toISOString();
    const targetState = (command === 'TURN_ON' || state === 'ON') ? 'ON' : 'OFF';

    await deviceService.acknowledgeCommand('LED-001', requestId, {
      simulated: true,
      command,
      ackTime: now,
    });

    await deviceService.updateDeviceStatus('LED-001', {
      light_status: targetState,
      status: DEVICE_STATUS.ONLINE,
      last_seen: now,
    });

    realtimeService.broadcast('DEVICE_STATUS', {
      deviceId: 'LED-001',
      device: { device_id: 'LED-001', light_status: targetState, status: 'ONLINE', last_seen: now },
      payload: { lightStatus: targetState },
    });

    await deviceService.addDeviceLog('LED-001', `LED_${targetState}`, `Single LED switched ${targetState}`);
  }

  // Gate command simulation
  async handleGateCommand(command, requestId) {
    logger.info(`[MOCK DEVICE] Received GATE command: ${command} (reqId: ${requestId})`);

    await deviceService.acknowledgeCommand('GATE-001', requestId, {
      simulated: true,
      ackTime: new Date().toISOString(),
    });

    realtimeService.broadcast('COMMAND_ACK', {
      deviceId: 'GATE-001',
      requestId,
      command,
      status: 'ACKNOWLEDGED',
    });

    if (command === 'OPEN') {
      if (this.gateState.gateStatus === GATE_STATUS.OPEN) return;

      this.gateState.gateStatus = GATE_STATUS.OPENING;
      await deviceService.updateDeviceStatus('GATE-001', {
        gate_status: GATE_STATUS.OPENING,
        last_seen: new Date().toISOString(),
      });

      realtimeService.broadcast('DEVICE_STATUS', {
        deviceId: 'GATE-001',
        gateStatus: GATE_STATUS.OPENING,
      });

      setTimeout(async () => {
        this.gateState.gateStatus = GATE_STATUS.OPEN;
        await deviceService.updateDeviceStatus('GATE-001', {
          gate_status: GATE_STATUS.OPEN,
          last_seen: new Date().toISOString(),
        });
        realtimeService.broadcast('DEVICE_STATUS', {
          deviceId: 'GATE-001',
          gateStatus: GATE_STATUS.OPEN,
        });
        await deviceService.addDeviceLog('GATE-001', EVENT_TYPES.GATE_OPENED, 'Gate fully OPENED (Limit switch triggered)');
      }, 3000);
    } else if (command === 'CLOSE') {
      if (this.gateState.gateStatus === GATE_STATUS.CLOSED) return;

      this.gateState.gateStatus = GATE_STATUS.CLOSING;
      await deviceService.updateDeviceStatus('GATE-001', {
        gate_status: GATE_STATUS.CLOSING,
        last_seen: new Date().toISOString(),
      });

      realtimeService.broadcast('DEVICE_STATUS', {
        deviceId: 'GATE-001',
        gateStatus: GATE_STATUS.CLOSING,
      });

      setTimeout(async () => {
        this.gateState.gateStatus = GATE_STATUS.CLOSED;
        await deviceService.updateDeviceStatus('GATE-001', {
          gate_status: GATE_STATUS.CLOSED,
          last_seen: new Date().toISOString(),
        });
        realtimeService.broadcast('DEVICE_STATUS', {
          deviceId: 'GATE-001',
          gateStatus: GATE_STATUS.CLOSED,
        });
        await deviceService.addDeviceLog('GATE-001', EVENT_TYPES.GATE_CLOSED, 'Gate fully CLOSED (Limit switch triggered)');
      }, 3000);
    }
  }

  // Street Light command simulation
  async handleStreetLightCommand(payload) {
    const { command, requestId, state, mode, zone, brightness } = payload;
    logger.info(`[MOCK DEVICE] Received STREET LIGHT command: ${command}`, payload);

    // Send immediate ACK
    await deviceService.acknowledgeCommand('STREETLIGHT-001', requestId, {
      simulated: true,
      command,
      ackTime: new Date().toISOString(),
    });

    realtimeService.broadcast('COMMAND_ACK', {
      deviceId: 'STREETLIGHT-001',
      requestId,
      command,
      status: 'ACKNOWLEDGED',
    });

    const now = new Date().toISOString();

    if (command === 'TURN_ON' || state === 'ON') {
      this.streetLightState.mode = DEVICE_MODE.MANUAL;
      this.streetLightState.lightStatus = LIGHT_STATUS.ON;
      this.streetLightState.ledBrightness = { led1: 255, led2: 255, led3: 255, led4: 255 };

      await deviceService.updateDeviceStatus('STREETLIGHT-001', {
        light_status: LIGHT_STATUS.ON,
        mode: DEVICE_MODE.MANUAL,
        last_seen: now,
      });

      realtimeService.broadcast('TELEMETRY_UPDATE', {
        deviceId: 'STREETLIGHT-001',
        telemetry: {
          ...this.streetLightState,
          timestamp: now,
        },
      });

      await deviceService.addDeviceLog('STREETLIGHT-001', EVENT_TYPES.LIGHT_TURNED_ON, 'All 4 street lamps switched to 100% brightness (MANUAL)');
    } else if (command === 'TURN_OFF' || state === 'OFF') {
      this.streetLightState.mode = DEVICE_MODE.MANUAL;
      this.streetLightState.lightStatus = LIGHT_STATUS.OFF;
      this.streetLightState.ledBrightness = { led1: 0, led2: 0, led3: 0, led4: 0 };

      await deviceService.updateDeviceStatus('STREETLIGHT-001', {
        light_status: LIGHT_STATUS.OFF,
        mode: DEVICE_MODE.MANUAL,
        last_seen: now,
      });

      realtimeService.broadcast('TELEMETRY_UPDATE', {
        deviceId: 'STREETLIGHT-001',
        telemetry: {
          ...this.streetLightState,
          timestamp: now,
        },
      });

      await deviceService.addDeviceLog('STREETLIGHT-001', EVENT_TYPES.LIGHT_TURNED_OFF, 'All 4 street lamps switched OFF (MANUAL)');
    } else if (command === 'SET_MODE' || command === 'SET_LIGHT_MODE') {
      const newMode = mode ? mode.toUpperCase() : DEVICE_MODE.AUTO;
      this.streetLightState.mode = newMode;

      if (newMode === DEVICE_MODE.AUTO) {
        this.streetLightState.lightStatus = LIGHT_STATUS.ADAPTIVE;
        this.streetLightState.ledBrightness = { led1: 60, led2: 60, led3: 60, led4: 60 };
      }

      await deviceService.updateDeviceStatus('STREETLIGHT-001', {
        mode: newMode,
        light_status: this.streetLightState.lightStatus,
        last_seen: now,
      });

      realtimeService.broadcast('TELEMETRY_UPDATE', {
        deviceId: 'STREETLIGHT-001',
        telemetry: {
          ...this.streetLightState,
          timestamp: now,
        },
      });
    }
  }

  async handleScheduleUpdate(scheduleData) {
    if (!this.isEnabled) return;
    await deviceService.addDeviceLog(
      'GATE-001',
      EVENT_TYPES.SCHEDULE_UPDATED,
      `ESP32 stored schedule update in NVS flash memory for ${scheduleData.day_of_week}`,
      { scheduleData }
    );
  }
}

export const mockDeviceSimulator = new MockDeviceSimulator();
