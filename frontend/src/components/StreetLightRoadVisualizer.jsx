import React from 'react';
import { Lightbulb, Car } from 'lucide-react';

export const StreetLightRoadVisualizer = ({ ledBrightness = {}, motionZones = {} }) => {
  const segments = [
    { id: 1, label: 'Section 1', pwm: ledBrightness.led1 || 0, motion: Boolean(motionZones.zone1) },
    { id: 2, label: 'Section 2', pwm: ledBrightness.led2 || 0, motion: Boolean(motionZones.zone2) },
    { id: 3, label: 'Section 3', pwm: ledBrightness.led3 || 0, motion: Boolean(motionZones.zone3) },
    { id: 4, label: 'Section 4', pwm: ledBrightness.led4 || 0, motion: Boolean(motionZones.zone4) },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Roadway Illumination Visualizer
          </div>
          <h3 className="text-base font-bold text-white font-mono mt-0.5">
            PHYSICAL STREET LIGHT ARRAY (4 SEGMENTS)
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span className="text-slate-400">0% OFF</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">24% Dim</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-amber-300 font-bold">100% Full</span>
          </div>
        </div>
      </div>

      {/* Roadway Canvas */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-6 overflow-x-auto">
        <div className="min-w-[640px] flex flex-col gap-6">
          {/* Street light posts row */}
          <div className="grid grid-cols-4 gap-4">
            {segments.map((seg) => {
              const isFull = seg.pwm >= 200;
              const isDim = seg.pwm > 0 && seg.pwm < 200;
              const isOff = seg.pwm === 0;

              return (
                <div key={seg.id} className="flex flex-col items-center relative">
                  {/* Lamp Fixture */}
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-20 ${
                      isFull
                        ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-[0_0_35px_rgba(251,191,36,0.85)]'
                        : isDim
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                        : 'bg-slate-900 border-slate-700 text-slate-600'
                    }`}
                  >
                    <Lightbulb className="w-5 h-5" />
                  </div>

                  {/* Lamp Pole */}
                  <div className="w-1.5 h-12 bg-gradient-to-b from-slate-600 to-slate-800 rounded" />

                  {/* Light Cone Cast onto Road */}
                  <div
                    className={`w-full h-24 rounded-t-full transition-all duration-500 pointer-events-none mt-1 ${
                      isFull
                        ? 'bg-gradient-to-b from-amber-400/40 via-amber-400/15 to-transparent'
                        : isDim
                        ? 'bg-gradient-to-b from-cyan-400/20 via-cyan-400/05 to-transparent'
                        : 'opacity-0'
                    }`}
                  />

                  {/* Label */}
                  <div className="text-[11px] font-mono font-bold text-slate-300 mt-2">
                    Lamp {seg.id}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {Math.round((seg.pwm / 255) * 100)}% ({seg.pwm} PWM)
                  </div>
                </div>
              );
            })}
          </div>

          {/* Roadway Surface */}
          <div className="relative h-20 bg-slate-900/90 border-y-2 border-slate-700 rounded flex items-center justify-between px-6">
            {/* Center Dashed Line */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-slate-600 pointer-events-none" />

            {/* Vehicle or motion indicators in each segment */}
            <div className="w-full grid grid-cols-4 gap-4 z-10">
              {segments.map((seg) => (
                <div key={seg.id} className="flex flex-col items-center justify-center">
                  {seg.motion ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-mono text-xs font-bold shadow-lg animate-bounce">
                      <Car className="w-4 h-4" />
                      <span>VEHICLE</span>
                    </div>
                  ) : (
                    <div className="h-6 flex items-center text-[10px] font-mono text-slate-600">
                      Empty
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
