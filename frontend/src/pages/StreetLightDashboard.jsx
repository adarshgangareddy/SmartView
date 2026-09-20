import React from 'react';
import { Header } from '../components/Header';
import { OfflineBanner } from '../components/OfflineBanner';
import { DeviceStatusCard } from '../components/DeviceStatusCard';
import { AmbientLightCard } from '../components/AmbientLightCard';
import { ZoneMotionMatrix } from '../components/ZoneMotionMatrix';
import { StreetLightRoadVisualizer } from '../components/StreetLightRoadVisualizer';
import { StreetLightControls } from '../components/StreetLightControls';
import { DeviceInfo } from '../components/DeviceInfo';
import { ActivityLog } from '../components/ActivityLog';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useStreetLight } from '../hooks/useStreetLight';
import { Wifi, Radio, Zap } from 'lucide-react';

export const StreetLightDashboard = () => {
  const {
    device,
    telemetry,
    logs,
    loading,
    error,
    commandPending,
    isRealtimeConnected,
    refresh,
    turnOn,
    turnOff,
    setMode,
    setZone,
  } = useStreetLight('STREETLIGHT-001');

  if (loading && !device) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Header isOnline={false} />
        <main className="flex-1 flex items-center justify-center p-4">
          <LoadingState message="Connecting to Street Light Node STREETLIGHT-001..." />
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
        {/* Realtime Connection Status Pill */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">OPERATION:</span>
            <span className="text-amber-400 font-bold">SMART STREET LIGHTING</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">HARDWARE TARGET:</span>
            <span className="text-emerald-400 font-semibold">Physical Node STREETLIGHT-001</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="relative flex h-2 w-2">
              {isRealtimeConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className={isRealtimeConnected ? 'text-emerald-400' : 'text-amber-400'}>
              {isRealtimeConnected ? 'WebSocket Live' : 'Polling Fallback'}
            </span>
          </div>
        </div>

        {/* Device Status Card */}
        <DeviceStatusCard
          device={device}
          isRefreshing={Boolean(commandPending)}
          onRefresh={refresh}
        />

        {/* Ambient Light Sensor & Remote Actuator Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AmbientLightCard
            isNight={telemetry?.is_night}
            ambientLight={telemetry?.ambient_light}
          />
          <StreetLightControls
            isOnline={isOnline}
            currentMode={device?.mode || 'AUTO'}
            commandPending={commandPending}
            onTurnOn={turnOn}
            onTurnOff={turnOff}
            onSetMode={setMode}
          />
        </div>

        {/* 4-Segment Interactive Road Visualizer */}
        <StreetLightRoadVisualizer
          ledBrightness={telemetry?.led_brightness}
          motionZones={telemetry?.motion_zones}
        />

        {/* 4-Zone Infrared Motion Matrix */}
        <ZoneMotionMatrix
          motionZones={telemetry?.motion_zones}
          ledBrightness={telemetry?.led_brightness}
        />

        {/* Telemetry & Audit Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <DeviceInfo
              device={{
                ...device,
                hardwareSpecs: 'Arduino / ESP32 + 1x LDR + 4x IR + 4x PWM LED',
              }}
            />
          </div>
          <div className="lg:col-span-2">
            <ActivityLog logs={logs} limit={8} />
          </div>
        </div>
      </main>

      {/* Industrial Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500 font-mono">
        SmartView IoT Operations Platform • Smart Street Lighting Operation • Real-time MQTT/WebSocket Telemetry
      </footer>
    </div>
  );
};
