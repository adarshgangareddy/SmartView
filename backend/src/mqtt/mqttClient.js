import mqtt from 'mqtt';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import { TOPICS } from './topics.js';
import { handleMqttMessage } from './handlers.js';
import { mockDeviceSimulator } from '../services/mockDeviceService.js';
import { deviceService } from '../services/deviceService.js';
import { DEVICE_STATUS } from '../utils/constants.js';

dotenv.config();

class MqttService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.brokerUrl = process.env.MQTT_BROKER_URL;
    this.username = process.env.MQTT_USERNAME;
    this.password = process.env.MQTT_PASSWORD;
    this.clientId = process.env.MQTT_CLIENT_ID || `gate-backend-${Math.random().toString(16).substring(2, 8)}`;
    this.heartbeatWatchdogTimer = null;
    this.timeoutSeconds = parseInt(process.env.HEARTBEAT_TIMEOUT_SECONDS || '90', 10);
  }

  connect() {
    if (!this.brokerUrl || this.brokerUrl.includes('placeholder')) {
      logger.info('No MQTT_BROKER_URL configured. Running in Mock/Simulated MQTT mode.');
      this.startHeartbeatWatchdog();
      return;
    }

    const options = {
      clientId: this.clientId,
      clean: true,
      connectTimeout: 8000,
      reconnectPeriod: 5000,
    };

    if (this.username) options.username = this.username;
    if (this.password) options.password = this.password;

    if (process.env.MQTT_TLS === 'true' || this.brokerUrl.startsWith('mqtts://') || this.brokerUrl.startsWith('ssl://')) {
      options.rejectUnauthorized = process.env.NODE_ENV === 'production';
    }

    logger.info(`Connecting to MQTT broker at ${this.brokerUrl}...`);

    try {
      this.client = mqtt.connect(this.brokerUrl, options);

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info(`Connected to MQTT Broker successfully (clientId: ${this.clientId})`);

        // Subscribe to all incoming gate topics
        const topicsToSub = [
          TOPICS.ALL_STATUS,
          TOPICS.ALL_ACK,
          TOPICS.ALL_HEARTBEAT,
          TOPICS.ALL_TELEMETRY,
        ];

        this.client.subscribe(topicsToSub, { qos: 1 }, (err) => {
          if (err) {
            logger.error('Failed to subscribe to gate topics:', err.message);
          } else {
            logger.info('Subscribed to MQTT topics:', topicsToSub.join(', '));
          }
        });
      });

      this.client.on('message', (topic, message) => {
        logger.mqtt(topic, message.toString());
        handleMqttMessage(topic, message.toString());
      });

      this.client.on('error', (err) => {
        logger.error('MQTT Client Error:', err.message);
      });

      this.client.on('close', () => {
        if (this.isConnected) {
          logger.warn('MQTT Connection closed. Reconnecting...');
        }
        this.isConnected = false;
      });
    } catch (err) {
      logger.error('MQTT Initialization error:', err.message);
    }

    this.startHeartbeatWatchdog();
  }

  startHeartbeatWatchdog() {
    if (this.heartbeatWatchdogTimer) return;

    logger.info(`Starting Heartbeat Watchdog (Timeout: ${this.timeoutSeconds}s)`);
    this.heartbeatWatchdogTimer = setInterval(async () => {
      try {
        const devices = await deviceService.getAllDevices();
        const now = Date.now();

        for (const device of devices) {
          if (device.status === DEVICE_STATUS.ONLINE && device.last_seen) {
            const lastSeenTime = new Date(device.last_seen).getTime();
            const elapsedSeconds = (now - lastSeenTime) / 1000;

            if (elapsedSeconds > this.timeoutSeconds) {
              await deviceService.markDeviceOffline(device.device_id);
            }
          }
        }
      } catch (err) {
        logger.error('Error in Heartbeat Watchdog cycle:', err.message);
      }
    }, 30000);
  }

  async publishCommand(deviceId, commandPayload) {
    const topic = TOPICS.command(deviceId);
    const payloadStr = JSON.stringify(commandPayload);

    logger.info(`Publishing command to ${topic}:`, commandPayload);

    // If real MQTT client is connected, publish via MQTT
    if (this.client && this.isConnected) {
      return new Promise((resolve, reject) => {
        this.client.publish(topic, payloadStr, { qos: 1 }, (err) => {
          if (err) {
            logger.error(`Failed to publish command to ${topic}:`, err.message);
            reject(err);
          } else {
            logger.info(`Published command to ${topic} successfully`);
            resolve(true);
          }
        });
      });
    }

    // Dev/Mock fallback
    if (mockDeviceSimulator.isEnabled) {
      logger.info(`[MQTT MOCK] Routing command to MockDeviceSimulator: ${commandPayload.command}`);
      mockDeviceSimulator.handleCommand(commandPayload.command, commandPayload.requestId);
      return true;
    }

    throw new Error('MQTT broker is not connected and mock device is disabled.');
  }

  async publishScheduleConfig(deviceId, schedulePayload) {
    const topic = TOPICS.config(deviceId);
    const payloadStr = JSON.stringify(schedulePayload);

    logger.info(`Publishing schedule configuration to ${topic}:`, schedulePayload);

    if (this.client && this.isConnected) {
      return new Promise((resolve, reject) => {
        this.client.publish(topic, payloadStr, { qos: 1 }, (err) => {
          if (err) {
            logger.error(`Failed to publish config to ${topic}:`, err.message);
            reject(err);
          } else {
            resolve(true);
          }
        });
      });
    }

    if (mockDeviceSimulator.isEnabled) {
      logger.info(`[MQTT MOCK] Routing schedule update to MockDeviceSimulator`);
      mockDeviceSimulator.handleScheduleUpdate(schedulePayload);
      return true;
    }

    return true;
  }
}

export const mqttService = new MqttService();
