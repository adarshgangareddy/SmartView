import React from 'react';
import { Radio, Car, Activity, ShieldCheck, Zap } from 'lucide-react';

export const ZoneMotionMatrix = ({ motionZones = {}, ledBrightness = {} }) => {
  const zones = [
    { id: 1, name: 'Zone 1', pin: 'D2', ledPin: 'D6', motion: Boolean(motionZones.zone1), brightness: ledBrightness.led1 || 0 },
    { id: 2, name: 'Zone 2', pin: 'D3', ledPin: 'D9', motion: Boolean(motionZones.zone2), brightness: ledBrightness.led2 || 0 },
    { id: 3, name: 'Zone 3', pin: 'D4', ledPin: 'D10', motion: Boolean(motionZones.zone3), brightness: ledBrightness.led3 || 0 },
    { id: 4, name: 'Zone 4', pin: 'D5', ledPin: 'D11', motion: Boolean(motionZones.zone4), brightness: ledBrightness.led4 || 0 },
  ];

  const getBrightnessPercent = (val) => {
    return Math.round((val / 255) * 100);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            Infrared Motion Matrix
          </div>
          <h3 className="text-base font-bold text-white font-mono mt-0.5">
            4-ZONE ROADWAY SENSORS
          </h3>
        </div>

        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
          Realtime Telemetry
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {zones.map((zone) => {
          const isDetected = zone.motion;
          const pct = getBrightnessPercent(zone.brightness);

          return (
            <div
              key={zone.id}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                isDetected
                  ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-slate-300 uppercase">
                  {zone.name}
                </span>
                <span
                  className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                    isDetected
                      ? 'bg-amber-500 text-slate-950 animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDetected ? 'OBJECT DETECTED' : 'CLEAR'}
                </span>
              </div>

              <div className="flex items-center gap-3 my-2">
                <div
                  className={`p-2.5 rounded-lg border flex items-center justify-center shrink-0 ${
                    isDetected
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-mono">Lamp Output</div>
                  <div className="text-lg font-bold font-mono text-white flex items-center gap-1.5">
                    <span>{pct}%</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      ({zone.brightness} PWM)
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    pct >= 80 ? 'bg-amber-400' : pct > 0 ? 'bg-cyan-400' : 'bg-slate-600'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>IR: Pin {zone.pin}</span>
                <span>LED: Pin {zone.ledPin}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
