import { api } from './api.js';

export const scheduleService = {
  async getSchedule(deviceId) {
    const res = await api.get(`/devices/${deviceId}/schedule`);
    return res.data?.schedules || [];
  },

  async updateSchedule(deviceId, scheduleData) {
    const res = await api.put(`/devices/${deviceId}/schedule`, scheduleData);
    return res.data;
  },
};
