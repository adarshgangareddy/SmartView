import { api } from './api.js';

export const streetLightService = {
  async getTelemetry(deviceId = 'STREETLIGHT-001') {
    const res = await api.get(`/devices/${deviceId}/telemetry`);
    return res.data?.telemetry;
  },

  async controlLight(deviceId, state) {
    const res = await api.post(`/devices/${deviceId}/commands/light`, { state });
    return res.data;
  },

  async setMode(deviceId, mode) {
    const res = await api.post(`/devices/${deviceId}/commands/light-mode`, { mode });
    return res.data;
  },

  async setZone(deviceId, zone, brightness) {
    const res = await api.post(`/devices/${deviceId}/commands/zone`, { zone, brightness });
    return res.data;
  },
};
