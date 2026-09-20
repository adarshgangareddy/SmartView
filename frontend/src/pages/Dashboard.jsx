import React from 'react';
import { Header } from '../components/Header';
import { OfflineBanner } from '../components/OfflineBanner';
import { DeviceStatusCard } from '../components/DeviceStatusCard';
import { GateStatusCard } from '../components/GateStatusCard';
import { ManualControl } from '../components/ManualControl';
import { ModeSelector } from '../components/ModeSelector';
import { ScheduleForm } from '../components/ScheduleForm';
import { CurrentScheduleList } from '../components/CurrentScheduleList';
import { DeviceInfo } from '../components/DeviceInfo';
import { ActivityLog } from '../components/ActivityLog';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useDevice } from '../hooks/useDevice';

export const Dashboard = () => {
  const {
    device,
    schedules,
    logs,
    loading,
    error,
    commandPending,
    isTransitioning,
    refresh,
    openGate,
    closeGate,
    setMode,
    updateSchedule,
  } = useDevice('GATE-001');

  if (loading && !device) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Header isOnline={false} />
        <main className="flex-1 flex items-center justify-center p-4">
          <LoadingState message="Connecting to Gate Controller GATE-001..." />
        </main>
      </div>
    );
  }

  if (error && !device) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Header isOnline={false} />
        <main className="flex-1 flex items-center justify-center p-4">
          <ErrorState message={error} onRetry={refresh} />
        </main>
      </div>
    );
  }

  const isOnline = device?.status === 'ONLINE';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Header isOnline={isOnline} lastSeen={device?.last_seen} />
      <OfflineBanner isOnline={isOnline} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Device Status Header Card */}
        <DeviceStatusCard
          device={device}
          isRefreshing={isTransitioning}
          onRefresh={refresh}
        />

        {/* Gate Status Card */}
        <GateStatusCard
          gateStatus={device?.gate_status}
          isOnline={isOnline}
          commandPending={commandPending}
        />

        {/* Operating Grid: Controls & Mode */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ManualControl
            gateStatus={device?.gate_status}
            isOnline={isOnline}
            commandPending={commandPending}
            onOpenGate={openGate}
            onCloseGate={closeGate}
          />
          <ModeSelector
            currentMode={device?.mode}
            isOnline={isOnline}
            onSelectMode={setMode}
          />
        </div>

        {/* Schedule Grid: Editor & Weekly Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScheduleForm
            schedules={schedules}
            isOnline={isOnline}
            onSaveSchedule={updateSchedule}
          />
          <CurrentScheduleList schedules={schedules} />
        </div>

        {/* Telemetry & Activity Feed Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <DeviceInfo device={device} />
          </div>
          <div className="lg:col-span-2">
            <ActivityLog logs={logs} limit={8} />
          </div>
        </div>
      </main>

      {/* Industrial Footer Bar */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500 font-mono">
        Remote Site Distance: ~500 km • Protocol: MQTT over TLS • Hardware: ESP32 + DS3231 RTC • Real-time Monitoring
      </footer>
    </div>
  );
};
