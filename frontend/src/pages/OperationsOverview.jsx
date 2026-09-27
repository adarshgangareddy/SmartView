import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { ConnectDeviceModal } from '../components/ConnectDeviceModal';
import { deviceService } from '../services/deviceService';
import { streetLightService } from '../services/streetLightService';
import { useRealtime } from '../hooks/useRealtime';
import { Shield, Lightbulb, ArrowRight, Zap, Loader2, Power, WifiOff, CheckCircle2 } from 'lucide-react';

export const OperationsOverview = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ledToggling, setLedToggling] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Fetch initial devices
  const fetchDevices = useCallback(() => {
    deviceService
      .getDevices()
      .then((data) => setDevices(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Listen for real-time WebSocket updates
  useRealtime(
    useCallback((msg) => {
      if (msg.event === 'DEVICE_STATUS' && msg.data) {
        const { deviceId, device, payload } = msg.data;
        setDevices((prev) =>
          prev.map((d) => {
            if (d.device_id === deviceId) {
              return {
                ...d,
                ...(device || {}),
                light_status: payload?.lightStatus || device?.light_status || d.light_status,
                gate_status: payload?.gateStatus || device?.gate_status || d.gate_status,
                status: device?.status || (payload?.online !== undefined ? (payload.online ? 'ONLINE' : 'OFFLINE') : d.status),
              };
            }
            return d;
          })
        );
      }
    }, [])
  );

  const gateDevice = devices.find((d) => d.device_type === 'GATE' || d.device_id === 'GATE-001');
  const lightDevice = devices.find((d) => d.device_type === 'STREET_LIGHT' || d.device_id === 'STREETLIGHT-001');
  const ledDevice = devices.find((d) => d.device_type === 'LED' || d.device_id === 'LED-001');

  const isLedOnline = ledDevice?.status === 'ONLINE';
  const isLedOn = ledDevice?.light_status === 'ON';

  const handleToggleLed = async () => {
    if (ledToggling) return;
    if (!isLedOnline) {
      setShowConnectModal(true);
      return;
    }

    setLedToggling(true);
    const nextState = isLedOn ? 'OFF' : 'ON';

    try {
      await streetLightService.controlLight('LED-001', nextState);
      setDevices((prev) =>
        prev.map((d) => (d.device_id === 'LED-001' ? { ...d, light_status: nextState } : d))
      );
    } catch (err) {
      console.error('Failed to toggle LED:', err);
    } finally {
      setLedToggling(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Platform Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                CENTRAL OPERATIONS HUB
              </div>
              <h1 className="text-3xl sm:text-4xl font-black font-mono text-white tracking-wide">
                SMARTVIEW PLATFORM
              </h1>
              <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                Unified multi-device operations platform controlling perimeter security gates, adaptive road illumination, and ESP32 hardware nodes.
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl text-center">
                <div className="text-slate-500 uppercase text-[10px]">Active Operations</div>
                <div className="text-xl font-bold text-white mt-0.5">{devices.length || 3}</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl text-center">
                <div className="text-slate-500 uppercase text-[10px]">Platform Status</div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">HEALTHY</div>
              </div>
            </div>
          </div>
        </div>

        {/* Operations Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Operation 1: Gate Control */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Operation 01
                </span>
              </div>

              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Perimeter Security</div>
              <h2 className="text-2xl font-bold font-mono text-white mt-1">
                REMOTE GATE CONTROL
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Long-distance perimeter barrier management with motorized relays, DS3231 autonomous weekly scheduling, and fail-safe travel limits.
              </p>

              <div className="mt-6 space-y-2 font-mono text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Node:</span>
                  <span className="text-white font-bold">{gateDevice?.device_id || 'GATE-001'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gate State:</span>
                  <span className="text-emerald-400 font-bold">{gateDevice?.gate_status || 'CLOSED'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mode:</span>
                  <span className="text-cyan-400">{gateDevice?.mode || 'AUTO'}</span>
                </div>
              </div>
            </div>

            <Link
              to="/operations/gate"
              className="mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
            >
              <span>LAUNCH GATE DASHBOARD</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Operation 2: Smart Street Lighting */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                  Operation 02
                </span>
              </div>

              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Infrastructure & Roadway</div>
              <h2 className="text-2xl font-bold font-mono text-white mt-1">
                SMART STREET LIGHTING
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Adaptive roadway illumination prototype. Uses 1x physical LDR sensor and 4x IR motion sensors to dynamically boost LED lamps from dim to 100%.
              </p>

              <div className="mt-6 space-y-2 font-mono text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Node:</span>
                  <span className="text-white font-bold">{lightDevice?.device_id || 'STREETLIGHT-001'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Illumination:</span>
                  <span className="text-amber-400 font-bold">{lightDevice?.light_status || 'ADAPTIVE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sensors Active:</span>
                  <span className="text-cyan-400">1x LDR + 4x IR (4 Zones)</span>
                </div>
              </div>
            </div>

            <Link
              to="/operations/street-light"
              className="mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
            >
              <span>LAUNCH STREET LIGHT</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Operation 3: Single LED ESP32 Control */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl border transition-colors ${
                  isLedOnline
                    ? isLedOn
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  {isLedOnline ? <Zap className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                  Operation 03
                </span>
              </div>

              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">ESP32 Hardware Test</div>
              <h2 className="text-2xl font-bold font-mono text-white mt-1">
                SINGLE LED CONTROLLER
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Direct GPIO pin control for ESP32 breadboard testing. Controls physical LED on GPIO 2 (on-board blue LED or external circuit) with instant real-time telemetry feedback.
              </p>

              {/* Offline Warning Box if device is not connected */}
              {!isLedOnline && (
                <div className="mt-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/90 text-rose-200 text-xs flex items-start gap-2.5 shadow-inner">
                  <WifiOff className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <span>Device is not connected</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-900 border border-rose-700 uppercase font-mono font-black">Offline</span>
                    </div>
                    <p className="text-rose-300/90 text-[11px] leading-relaxed">
                      Please connect your physical ESP32 to power and ensure it is connected to Wi-Fi to send commands.
                    </p>
                  </div>
                </div>
              )}

              {/* Hardware Telemetry Specs */}
              <div className="mt-4 space-y-2 font-mono text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Node:</span>
                  <span className="text-white font-bold">{ledDevice?.device_id || 'LED-001'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hardware Pin:</span>
                  <span className="text-cyan-400 font-bold">GPIO 2 (Built-in / D2)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Connection:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    isLedOnline
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {isLedOnline ? '● ONLINE' : '○ DISCONNECTED'}
                  </span>
                </div>
                {isLedOnline && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                    <span className="text-slate-500">LED State:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      isLedOn
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {isLedOn ? '● LED IS ON' : '○ LED IS OFF'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button: Disconnected guide vs Active Toggle */}
            {!isLedOnline ? (
              <button
                type="button"
                onClick={() => setShowConnectModal(true)}
                className="mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 hover:border-rose-700 transition-all shadow-md select-none"
              >
                <WifiOff className="w-4 h-4 text-rose-400" />
                <span>DEVICE NOT CONNECTED — HOW TO CONNECT</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleLed}
                disabled={ledToggling}
                className={`mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md select-none ${
                  isLedOn
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {ledToggling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>TRANSMITTING COMMAND...</span>
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4" />
                    <span>{isLedOn ? 'SWITCH LED OFF' : 'SWITCH LED ON'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Device Connection Modal Guide */}
      <ConnectDeviceModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        deviceId="LED-001"
        isOnline={isLedOnline}
      />
    </div>
  );
};
