import { supabase, isMockDb, memoryStore } from '../db/supabase.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { DEVICE_STATUS, GATE_STATUS, EVENT_TYPES } from '../utils/constants.js';

export const deviceService = {
  async getAllDevices() {
    if (isMockDb) {
      return memoryStore.devices;
    }

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching devices from Supabase:', error.message);
      throw error;
    }
    return data;
  },

  async getDeviceById(deviceId) {
    if (isMockDb) {
      const dev = memoryStore.devices.find((d) => d.device_id === deviceId);
      return dev || null;
    }

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (error) {
      logger.error(`Error fetching device ${deviceId}:`, error.message);
      throw error;
    }
    return data;
  },

  async updateDeviceStatus(deviceId, updates) {
    const timestamp = new Date().toISOString();
    const updatePayload = {
      updated_at: timestamp,
    };

    if (updates.status) updatePayload.status = updates.status;
    if (updates.gate_status) updatePayload.gate_status = updates.gate_status;
    if (updates.mode) updatePayload.mode = updates.mode;
    if (updates.firmware_version) updatePayload.firmware_version = updates.firmware_version;
    if (updates.last_seen !== undefined) updatePayload.last_seen = updates.last_seen || timestamp;

    if (isMockDb) {
      const devIndex = memoryStore.devices.findIndex((d) => d.device_id === deviceId);
      if (devIndex !== -1) {
        memoryStore.devices[devIndex] = {
          ...memoryStore.devices[devIndex],
          ...updatePayload,
        };
        return memoryStore.devices[devIndex];
      }
      return null;
    }

    const { data, error } = await supabase
      .from('devices')
      .update(updatePayload)
      .eq('device_id', deviceId)
      .select()
      .maybeSingle();

    if (error) {
      logger.error(`Error updating device ${deviceId}:`, error.message);
      throw error;
    }
    return data;
  },

  async markDeviceOffline(deviceId) {
    const timestamp = new Date().toISOString();
    logger.warn(`Device ${deviceId} marked OFFLINE due to heartbeat timeout`);
    await this.updateDeviceStatus(deviceId, { status: DEVICE_STATUS.OFFLINE });
    await this.addDeviceLog(deviceId, EVENT_TYPES.DEVICE_OFFLINE, `Device ${deviceId} went OFFLINE (heartbeat missed)`);
  },

  async createCommand(deviceId, command, requestedBy = 'operator', metadata = {}) {
    const commandRecord = {
      id: uuidv4(),
      device_id: deviceId,
      command,
      requested_by: requestedBy,
      status: 'SENT',
      metadata,
      created_at: new Date().toISOString(),
    };

    if (isMockDb) {
      memoryStore.commands.unshift(commandRecord);
      return commandRecord;
    }

    const { data, error } = await supabase
      .from('commands')
      .insert(commandRecord)
      .select()
      .single();

    if (error) {
      logger.error('Error recording command in Supabase:', error.message);
      throw error;
    }
    return data;
  },

  async acknowledgeCommand(deviceId, requestId, metadata = {}) {
    const completedAt = new Date().toISOString();

    if (isMockDb) {
      const cmd = memoryStore.commands.find((c) => c.id === requestId || (c.device_id === deviceId && c.status === 'SENT'));
      if (cmd) {
        cmd.status = 'ACKNOWLEDGED';
        cmd.completed_at = completedAt;
        if (metadata) cmd.metadata = { ...cmd.metadata, ...metadata };
        return cmd;
      }
      return null;
    }

    const { data, error } = await supabase
      .from('commands')
      .update({
        status: 'ACKNOWLEDGED',
        completed_at: completedAt,
        metadata,
      })
      .eq('id', requestId)
      .select()
      .maybeSingle();

    if (error) {
      logger.error(`Error updating command acknowledgement:`, error.message);
    }
    return data;
  },

  async getDeviceLogs(deviceId, limit = 50) {
    if (isMockDb) {
      return memoryStore.device_logs
        .filter((l) => l.device_id === deviceId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);
    }

    const { data, error } = await supabase
      .from('device_logs')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error(`Error fetching logs for device ${deviceId}:`, error.message);
      throw error;
    }
    return data || [];
  },

  async addDeviceLog(deviceId, eventType, message, metadata = {}) {
    const logRecord = {
      id: uuidv4(),
      device_id: deviceId,
      event_type: eventType,
      message,
      metadata,
      created_at: new Date().toISOString(),
    };

    if (isMockDb) {
      memoryStore.device_logs.unshift(logRecord);
      if (memoryStore.device_logs.length > 200) {
        memoryStore.device_logs.pop();
      }
      return logRecord;
    }

    const { data, error } = await supabase
      .from('device_logs')
      .insert(logRecord)
      .select()
      .maybeSingle();

    if (error) {
      logger.error(`Error adding device log:`, error.message);
    }
    return data;
  },
};
