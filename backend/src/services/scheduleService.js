import { supabase, isMockDb, memoryStore } from '../db/supabase.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { DAYS_OF_WEEK } from '../utils/constants.js';

// Normalize time strings to HH:mm:00
const normalizeTime = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.trim().split(':');
  const h = parts[0].padStart(2, '0');
  const m = (parts[1] || '00').padStart(2, '0');
  const s = (parts[2] || '00').padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const scheduleService = {
  validateScheduleTimes(openTime, closeTime) {
    const normOpen = normalizeTime(openTime);
    const normClose = normalizeTime(closeTime);

    if (normClose <= normOpen) {
      return {
        valid: false,
        message: 'Closing time must be strictly after opening time.',
      };
    }
    return { valid: true, openTime: normOpen, closeTime: normClose };
  },

  async getSchedulesByDevice(deviceId) {
    if (isMockDb) {
      // Return schedules sorted by Day of Week order
      const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
      return memoryStore.schedules
        .filter((s) => s.device_id === deviceId)
        .sort((a, b) => (dayOrder[a.day_of_week] || 0) - (dayOrder[b.day_of_week] || 0));
    }

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('device_id', deviceId);

    if (error) {
      logger.error(`Error fetching schedules for ${deviceId}:`, error.message);
      throw error;
    }

    const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
    return (data || []).sort((a, b) => (dayOrder[a.day_of_week] || 0) - (dayOrder[b.day_of_week] || 0));
  },

  async updateSchedule(deviceId, scheduleData) {
    const { day_of_week, open_time, close_time, enabled = true } = scheduleData;

    const validation = this.validateScheduleTimes(open_time, close_time);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const normalizedOpen = validation.openTime;
    const normalizedClose = validation.closeTime;
    const timestamp = new Date().toISOString();

    if (isMockDb) {
      const index = memoryStore.schedules.findIndex(
        (s) => s.device_id === deviceId && s.day_of_week.toLowerCase() === day_of_week.toLowerCase()
      );

      const record = {
        id: index !== -1 ? memoryStore.schedules[index].id : uuidv4(),
        device_id: deviceId,
        day_of_week,
        open_time: normalizedOpen,
        close_time: normalizedClose,
        enabled: Boolean(enabled),
        updated_at: timestamp,
        created_at: index !== -1 ? memoryStore.schedules[index].created_at : timestamp,
      };

      if (index !== -1) {
        memoryStore.schedules[index] = record;
      } else {
        memoryStore.schedules.push(record);
      }

      return record;
    }

    // Upsert into Supabase
    const { data, error } = await supabase
      .from('schedules')
      .upsert(
        {
          device_id: deviceId,
          day_of_week,
          open_time: normalizedOpen,
          close_time: normalizedClose,
          enabled: Boolean(enabled),
          updated_at: timestamp,
        },
        { onConflict: 'device_id,day_of_week' }
      )
      .select()
      .single();

    if (error) {
      logger.error(`Error saving schedule for ${deviceId} (${day_of_week}):`, error.message);
      throw error;
    }

    return data;
  },
};
