import { api } from './api.js';

export const deviceService = {
  async getDevices() {
    const res = await api.get('/devices');
    return res.data?.devices || [];
  },

  async getDevice(deviceId) {
    const res = await api.get(`/devices/${deviceId}`);
    return res.data?.device;
  },

  async getStatus(deviceId) {
    const res = await api.get(`/devices/${deviceId}/status`);
    return res.data;
  },

  async openGate(deviceId) {
    const res = await api.post(`/devices/${deviceId}/commands/open`);
    return res.data;
  },

  async closeGate(deviceId) {
    const res = await api.post(`/devices/${deviceId}/commands/close`);
    return res.data;
  },

  async setMode(deviceId, mode) {
    const res = await api.post(`/devices/${deviceId}/commands/mode`, { mode });
    return res.data;
  },

  async getLogs(deviceId, limit = 50) {
    const res = await api.get(`/devices/${deviceId}/logs?limit=${limit}`);
    return res.data?.logs || [];
  },
};
