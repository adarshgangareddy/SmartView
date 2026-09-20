/**
 * MQTT Topics Structure as specified in Section 13:
 * gate/{deviceId}/command
 * gate/{deviceId}/status
 * gate/{deviceId}/config
 * gate/{deviceId}/ack
 * gate/{deviceId}/heartbeat
 * gate/{deviceId}/telemetry
 */

export const TOPICS = {
  command: (deviceId) => `gate/${deviceId}/command`,
  status: (deviceId) => `gate/${deviceId}/status`,
  config: (deviceId) => `gate/${deviceId}/config`,
  ack: (deviceId) => `gate/${deviceId}/ack`,
  heartbeat: (deviceId) => `gate/${deviceId}/heartbeat`,
  telemetry: (deviceId) => `gate/${deviceId}/telemetry`,

  // Wildcard patterns for backend listener
  ALL_STATUS: 'gate/+/status',
  ALL_ACK: 'gate/+/ack',
  ALL_HEARTBEAT: 'gate/+/heartbeat',
  ALL_TELEMETRY: 'gate/+/telemetry',
};

export const parseTopic = (topic) => {
  const parts = topic.split('/');
  if (parts.length >= 3 && parts[0] === 'gate') {
    return {
      prefix: parts[0],
      deviceId: parts[1],
      type: parts[2],
    };
  }
  return null;
};
