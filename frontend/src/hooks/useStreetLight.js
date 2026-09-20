import { useState, useEffect, useCallback } from 'react';
import { deviceService } from '../services/deviceService';
import { streetLightService } from '../services/streetLightService';
import { useRealtime } from './useRealtime';
import { useNotification } from '../context/NotificationContext';
import { usePolling } from './usePolling';

export const useStreetLight = (deviceId = 'STREETLIGHT-001') => {
  const { showToast } = useNotification();

  const [device, setDevice] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commandPending, setCommandPending] = useState(null);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);

      const [devData, telemData, logsData] = await Promise.all([
        deviceService.getDevice(deviceId),
        streetLightService.getTelemetry(deviceId),
        deviceService.getLogs(deviceId, 20),
      ]);

      setDevice(devData);
      setTelemetry(telemData);
      setLogs(logsData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch street light data');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [deviceId]);

  // Handle incoming real-time WebSocket messages
  const handleRealtimeMessage = useCallback((packet) => {
    if (!packet || !packet.data) return;
    const { event, data } = packet;

    if (data.deviceId !== deviceId) return;

    if (event === 'TELEMETRY_UPDATE') {
      if (data.telemetry) {
        setTelemetry(data.telemetry);
      }
      if (data.deviceStatus) {
        setDevice((prev) => (prev ? { ...prev, ...data.deviceStatus } : prev));
      }
      setCommandPending(null);
    } else if (event === 'DEVICE_STATUS') {
      if (data.device) {
        setDevice(data.device);
      }
    } else if (event === 'COMMAND_ACK') {
      setCommandPending(null);
    } else if (event === 'HEARTBEAT') {
      setDevice((prev) => (prev ? { ...prev, status: 'ONLINE', last_seen: data.timestamp } : prev));
    }
  }, [deviceId]);

  const { isConnected: isRealtimeConnected } = useRealtime(handleRealtimeMessage);

  // Initial fetch
  useEffect(() => {
    fetchData(true);
  }, [deviceId]);

  // Fallback polling (every 10s if WebSocket active, or 4s if WebSocket disconnected)
  usePolling(() => fetchData(false), isRealtimeConnected ? 10000 : 4000, true);

  const handleTurnOn = async () => {
    try {
      setCommandPending('TURN_ON');
      showToast('Command sent to turn lights ON. Awaiting device...', 'info');
      await streetLightService.controlLight(deviceId, 'ON');
      await fetchData(false);
    } catch (err) {
      setCommandPending(null);
      showToast(err.message || 'Failed to turn light ON', 'error');
    }
  };

  const handleTurnOff = async () => {
    try {
      setCommandPending('TURN_OFF');
      showToast('Command sent to turn lights OFF. Awaiting device...', 'info');
      await streetLightService.controlLight(deviceId, 'OFF');
      await fetchData(false);
    } catch (err) {
      setCommandPending(null);
      showToast(err.message || 'Failed to turn light OFF', 'error');
    }
  };

  const handleSetMode = async (mode) => {
    try {
      setCommandPending(`MODE_${mode}`);
      showToast(`Switching operating mode to ${mode}...`, 'info');
      await streetLightService.setMode(deviceId, mode);
      await fetchData(false);
      showToast(`Mode switched to ${mode}`, 'success');
    } catch (err) {
      setCommandPending(null);
      showToast(err.message || 'Failed to switch mode', 'error');
    }
  };

  const handleSetZone = async (zone, brightness) => {
    try {
      await streetLightService.setZone(deviceId, zone, brightness);
      await fetchData(false);
    } catch (err) {
      showToast(err.message || `Failed to set Zone ${zone} brightness`, 'error');
    }
  };

  return {
    device,
    telemetry,
    logs,
    loading,
    error,
    commandPending,
    isRealtimeConnected,
    refresh: () => fetchData(false),
    turnOn: handleTurnOn,
    turnOff: handleTurnOff,
    setMode: handleSetMode,
    setZone: handleSetZone,
  };
};
