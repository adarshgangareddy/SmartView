import React from 'react';
import { Header } from '../components/Header';
import { useDevice } from '../hooks/useDevice';
import { Settings as SettingsIcon, Cpu, Radio, Shield, HardDrive, Info } from 'lucide-react';

export const Settings = () => {
  const { device } = useDevice('GATE-001');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Header isOnline={device?.status === 'ONLINE'} lastSeen={device?.last_seen} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
            <SettingsIcon className="w-4 h-4 text-emerald-400" />
            System Parameters & OTA Provisioning
          </div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            GATEWAY SETTINGS
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Hardware node configurations and remote management options
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Node Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-white border-b border-slate-800 pb-3">
              <Cpu className="w-4 h-4 text-cyan-400" />
              TARGET GATE NODE
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Device ID</span>
                <span className="text-white font-bold">{device?.device_id || 'GATE-001'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Node Name</span>
                <span className="text-slate-200">{device?.name || 'Main Security Gate'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Heartbeat Watchdog</span>
                <span className="text-emerald-400">90 Seconds (Auto-Failover)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Motor Watchdog Timeout</span>
                <span className="text-amber-400">20 Seconds</span>
              </div>
            </div>
          </div>

          {/* OTA Firmware Readiness */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-white border-b border-slate-800 pb-3">
              <HardDrive className="w-4 h-4 text-purple-400" />
              FIRMWARE & OTA STATUS
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Installed Firmware</span>
                <span className="text-white font-bold">v{device?.firmware_version || '1.0.0'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">OTA Architecture</span>
                <span className="text-emerald-400">Armed & Ready (ArduinoOTA / HTTP)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">NVS Partition</span>
                <span className="text-slate-300">Preferences.h Persistent Storage</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                OTA Remote flashing support is architected directly in the ESP32 firmware module (`OtaManager.cpp`). Binaries can be pushed through authenticated channels without physical site visits.
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
