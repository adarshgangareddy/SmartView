import { useState, useEffect, useCallback, useRef } from 'react';
import { deviceService } from '../services/deviceService';
import { scheduleService } from '../services/scheduleService';
import { usePolling } from './usePolling';
import { useNotification } from '../context/NotificationContext';

export const useDevice = (deviceId = 'GATE-001') => {
  const { showToast } = useNotification();

  const [device, setDevice] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commandPending, setCommandPending] = useState(null); // 'OPEN' | 'CLOSE' | 'MODE' | null

  // Track previous gate status to detect transition completion
  const prevGateStatus = useRef(null);

  // Fetch full device state
  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);

      const [deviceData, scheduleData, logsData] = await Promise.all([
        deviceService.getDevice(deviceId),
        scheduleService.getSchedule(deviceId),
        deviceService.getLogs(deviceId, 20),
      ]);

      setDevice(deviceData);
      setSchedules(scheduleData);
      setLogs(logsData);
      setError(null);

      // Check if transitioning state resolved
      if (
        commandPending &&
        deviceData &&
        (deviceData.gate_status === 'OPEN' || deviceData.gate_status === 'CLOSED') &&
        deviceData.gate_status !== 'OPENING' &&
        deviceData.gate_status !== 'CLOSING'
      ) {
        setCommandPending(null);
      }

      prevGateStatus.current = deviceData?.gate_status;
    } catch (err) {
      setError(err.message || 'Failed to fetch device data');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [deviceId, commandPending]);

  // Initial load
  useEffect(() => {
    fetchData(true);
  }, [deviceId]);

  // Dynamic polling: Poll every 2 seconds if transitioning or command pending, else every 6 seconds
  const isTransitioning =
    device?.gate_status === 'OPENING' ||
    device?.gate_status === 'CLOSING' ||
    Boolean(commandPending);

  usePolling(() => fetchData(false), isTransitioning ? 2000 : 6000, true);

  // Open Gate command
  const handleOpenGate = async () => {
    if (device?.status !== 'ONLINE') {
      showToast('Device is offline. Cannot send command.', 'error');
      return;
    }
    try {
      setCommandPending('OPEN');
      showToast('Command sent. Awaiting device acknowledgement...', 'info');
      await deviceService.openGate(deviceId);
      await fetchData(false);
    } catch (err) {
      setCommandPending(null);
      showToast(err.message || 'Failed to send open command', 'error');
    }
  };

  // Close Gate command
  const handleCloseGate = async () => {
    if (device?.status !== 'ONLINE') {
      showToast('Device is offline. Cannot send command.', 'error');
      return;
    }
    try {
      setCommandPending('CLOSE');
      showToast('Command sent. Awaiting device acknowledgement...', 'info');
      await deviceService.closeGate(deviceId);
      await fetchData(false);
    } catch (err) {
      setCommandPending(null);
      showToast(err.message || 'Failed to send close command', 'error');
    }
  };

  // Set Mode command
  const handleSetMode = async (newMode) => {
    try {
      await deviceService.setMode(deviceId, newMode);
      showToast(`Gate mode switched to ${newMode}`, 'success');
      await fetchData(false);
    } catch (err) {
      showToast(err.message || 'Failed to switch operating mode', 'error');
    }
  };

  // Update Schedule
  const handleUpdateSchedule = async (scheduleData) => {
    try {
      const res = await scheduleService.updateSchedule(deviceId, scheduleData);
      showToast('Schedule updated & synchronized with device!', 'success');
      await fetchData(false);
      return res;
    } catch (err) {
      showToast(err.message || 'Unable to update schedule.', 'error');
      throw err;
    }
  };

  return {
    device,
    schedules,
    logs,
    loading,
    error,
    commandPending,
    isTransitioning,
    refresh: () => fetchData(false),
    openGate: handleOpenGate,
    closeGate: handleCloseGate,
    setMode: handleSetMode,
    updateSchedule: handleUpdateSchedule,
  };
};
