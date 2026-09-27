/**
 * Scalable MQTT Topics for SmartView Platform
 * Supports both:
 * - smartview/devices/{deviceId}/... (Standard SmartView hierarchy)
 * - gate/{deviceId}/... (Legacy/Gate compatibility)
 */

export const TOPICS = {
  command: (deviceId) => `smartview/devices/${deviceId}/command`,
  status: (deviceId) => `smartview/devices/${deviceId}/status`,
  config: (deviceId) => `smartview/devices/${deviceId}/config`,
  ack: (deviceId) => `smartview/devices/${deviceId}/ack`,
  heartbeat: (deviceId) => `smartview/devices/${deviceId}/heartbeat`,
  telemetry: (deviceId) => `smartview/devices/${deviceId}/telemetry`,

  // Gate-specific legacy helpers
  gateCommand: (deviceId) => `gate/${deviceId}/command`,
  gateConfig: (deviceId) => `gate/${deviceId}/config`,

  // Wildcard patterns for backend listener
  ALL_SMARTVIEW_STATUS: 'smartview/devices/+/status',
  ALL_SMARTVIEW_ACK: 'smartview/devices/+/ack',
  ALL_SMARTVIEW_HEARTBEAT: 'smartview/devices/+/heartbeat',
  ALL_SMARTVIEW_TELEMETRY: 'smartview/devices/+/telemetry',

  ALL_GATE_STATUS: 'gate/+/status',
  ALL_GATE_ACK: 'gate/+/ack',
  ALL_GATE_HEARTBEAT: 'gate/+/heartbeat',
  ALL_GATE_TELEMETRY: 'gate/+/telemetry',
};

export const parseTopic = (topic) => {
  const parts = topic.split('/');

  // Check: smartview/devices/{deviceId}/{type}
  if (parts.length >= 4 && parts[0] === 'smartview' && parts[1] === 'devices') {
    return {
      prefix: parts[0],
      deviceId: parts[2],
      type: parts[3],
    };
  }

  // Check: gate/{deviceId}/{type}
  if (parts.length >= 3 && parts[0] === 'gate') {
    return {
      prefix: parts[0],
      deviceId: parts[1],
      type: parts[2],
    };
  }

  return null;
};
