import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { deviceService } from '../services/deviceService';
import { Shield, Lightbulb, ArrowRight, Cpu, Radio, Activity, CheckCircle2, Clock } from 'lucide-react';
import { formatTimeAgo } from '../utils/formatters';

export const OperationsOverview = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deviceService
      .getDevices()
      .then((data) => setDevices(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const gateDevice = devices.find((d) => d.device_type === 'GATE' || d.device_id === 'GATE-001');
  const lightDevice = devices.find((d) => d.device_type === 'STREET_LIGHT' || d.device_id === 'STREETLIGHT-001');

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
                Unified multi-device operations platform controlling perimeter security gates and adaptive road illumination systems.
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl text-center">
                <div className="text-slate-500 uppercase text-[10px]">Active Operations</div>
                <div className="text-xl font-bold text-white mt-0.5">2</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl text-center">
                <div className="text-slate-500 uppercase text-[10px]">Platform Status</div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">HEALTHY</div>
              </div>
            </div>
          </div>
        </div>

        {/* Operations Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  Real Hardware Tested
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
                  <span className="text-slate-500">Illumination State:</span>
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
              <span>LAUNCH STREET LIGHT DASHBOARD</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
