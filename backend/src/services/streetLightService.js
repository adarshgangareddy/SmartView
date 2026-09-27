import { supabase, isMockDb, memoryStore } from '../db/supabase.js';
import { deviceService } from './deviceService.js';
import { realtimeService } from './realtimeService.js';
import { mqttService } from '../mqtt/mqttClient.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { EVENT_TYPES, COMMAND_TYPES, LIGHT_STATUS, DEVICE_MODE } from '../utils/constants.js';

export const streetLightService = {
  async getLatestTelemetry(deviceId = 'STREETLIGHT-001') {
    if (isMockDb) {
      const records = memoryStore.street_light_telemetry
        .filter((t) => t.device_id === deviceId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return records[0] || null;
    }

    const { data, error } = await supabase
      .from('street_light_telemetry')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error(`Error fetching telemetry for ${deviceId}:`, error.message);
      throw error;
    }
    return data;
  },

  async recordTelemetry(deviceId, telemetryData) {
    const timestamp = telemetryData.timestamp || new Date().toISOString();

    const record = {
      id: uuidv4(),
      device_id: deviceId,
      is_night: Boolean(telemetryData.isNight !== undefined ? telemetryData.isNight : telemetryData.is_night),
      ambient_light: telemetryData.ambientLight || (telemetryData.isNight ? 'NIGHT' : 'DAY'),
      motion_zones: telemetryData.motionZones || telemetryData.motion_zones || {
        zone1: false,
        zone2: false,
        zone3: false,
        zone4: false,
      },
      led_brightness: telemetryData.ledBrightness || telemetryData.led_brightness || {
        led1: 0,
        led2: 0,
        led3: 0,
        led4: 0,
      },
      mode: telemetryData.mode || DEVICE_MODE.AUTO,
      created_at: timestamp,
    };

    if (isMockDb) {
      memoryStore.street_light_telemetry.unshift(record);
      if (memoryStore.street_light_telemetry.length > 200) {
        memoryStore.street_light_telemetry.pop();
      }
    } else {
      const { error } = await supabase.from('street_light_telemetry').insert(record);
      if (error) {
        logger.error('Error saving street light telemetry to Supabase:', error.message);
      }
    }

    // Determine overall light status
    const leds = record.led_brightness;
    let lightStatus = LIGHT_STATUS.OFF;
    const anyOn = leds.led1 > 0 || leds.led2 > 0 || leds.led3 > 0 || leds.led4 > 0;
    const allFull = leds.led1 >= 250 && leds.led2 >= 250 && leds.led3 >= 250 && leds.led4 >= 250;
    if (record.mode === 'AUTO') {
      lightStatus = LIGHT_STATUS.ADAPTIVE;
    } else if (allFull) {
      lightStatus = LIGHT_STATUS.ON;
    } else if (anyOn) {
      lightStatus = LIGHT_STATUS.DIM;
    }

    // Update device last_seen and light_status
    await deviceService.updateDeviceStatus(deviceId, {
      status: 'ONLINE',
      light_status: lightStatus,
      mode: record.mode,
      last_seen: timestamp,
    });

    // Check if any motion was detected to log event
    const motion = record.motion_zones;
    const activeZones = [];
    if (motion.zone1) activeZones.push('Zone 1');
    if (motion.zone2) activeZones.push('Zone 2');
    if (motion.zone3) activeZones.push('Zone 3');
    if (motion.zone4) activeZones.push('Zone 4');

    if (activeZones.length > 0) {
      await deviceService.addDeviceLog(
        deviceId,
        EVENT_TYPES.MOTION_DETECTED,
        `Motion detected in ${activeZones.join(', ')} - Street light output boosted to 100%`,
        { activeZones, ledBrightness: record.led_brightness }
      );
    }

    // Broadcast in real-time over WebSocket!
    realtimeService.broadcast('TELEMETRY_UPDATE', {
      deviceId,
      telemetry: record,
      deviceStatus: {
        status: 'ONLINE',
        lightStatus,
        mode: record.mode,
        lastSeen: timestamp,
      },
    });

    return record;
  },

  async setLightState(deviceId, state, requestedBy = 'operator') {
    const device = await deviceService.getDeviceById(deviceId);
    if (!device) {
      throw new Error(`Device '${deviceId}' not found.`);
    }

    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    let targetBrightness = 0;
    let commandType = COMMAND_TYPES.TURN_OFF;

    if (state === 'ON') {
      targetBrightness = 255;
      commandType = COMMAND_TYPES.TURN_ON;
    } else if (state === 'DIM') {
      targetBrightness = 60;
      commandType = COMMAND_TYPES.SET_BRIGHTNESS;
    }

    // Record command
    const commandRecord = await deviceService.createCommand(deviceId, commandType, requestedBy, {
      state,
      targetBrightness,
      requestId,
    });

    // Log event
    await deviceService.addDeviceLog(
      deviceId,
      EVENT_TYPES.COMMAND_SENT,
      `Manual control: Turn lights ${state} (Requested by ${requestedBy})`,
      { state, targetBrightness, requestId }
    );

    // Publish via MQTT
    const payload = {
      command: commandType,
      state,
      targetBrightness,
      requestId,
      timestamp,
    };

    await mqttService.publishCommand(deviceId, payload);

    return {
      commandId: commandRecord.id,
      requestId,
      deviceId,
      command: commandType,
      status: 'SENT',
      message: `Command sent to turn lights ${state}. Awaiting physical device acknowledgement.`,
    };
  },

  async setMode(deviceId, mode, requestedBy = 'operator') {
    const normalizedMode = mode.toUpperCase();
    if (![DEVICE_MODE.AUTO, DEVICE_MODE.MANUAL].includes(normalizedMode)) {
      throw new Error('Mode must be either AUTO or MANUAL.');
    }

    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    await deviceService.updateDeviceStatus(deviceId, { mode: normalizedMode });

    await deviceService.createCommand(deviceId, COMMAND_TYPES.SET_LIGHT_MODE, requestedBy, {
      mode: normalizedMode,
      requestId,
    });

    await deviceService.addDeviceLog(
      deviceId,
      EVENT_TYPES.MODE_CHANGED,
      `Street lighting operating mode changed to ${normalizedMode} by ${requestedBy}`,
      { mode: normalizedMode, requestId }
    );

    const payload = {
      command: 'SET_MODE',
      mode: normalizedMode,
      requestId,
      timestamp,
    };

    await mqttService.publishCommand(deviceId, payload);

    // Broadcast WebSocket state
    realtimeService.broadcast('DEVICE_MODE_CHANGED', {
      deviceId,
      mode: normalizedMode,
      timestamp,
    });

    return {
      deviceId,
      mode: normalizedMode,
      message: `Operating mode updated to ${normalizedMode}`,
    };
  },

  async setZoneBrightness(deviceId, zone, brightness, requestedBy = 'operator') {
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    const payload = {
      command: 'SET_ZONE',
      zone: parseInt(zone, 10),
      brightness: parseInt(brightness, 10),
      requestId,
      timestamp,
    };

    await deviceService.createCommand(deviceId, COMMAND_TYPES.SET_ZONE, requestedBy, payload);

    await deviceService.addDeviceLog(
      deviceId,
      EVENT_TYPES.COMMAND_SENT,
      `Manual Zone ${zone} brightness set to ${brightness} by ${requestedBy}`,
      payload
    );

    await mqttService.publishCommand(deviceId, payload);

    return {
      commandId: requestId,
      deviceId,
      zone,
      brightness,
      status: 'SENT',
    };
  },
};
