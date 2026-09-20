import React from 'react';
import { Sun, Moon, Eye } from 'lucide-react';

export const AmbientLightCard = ({ isNight = false, ambientLight = 'DAY' }) => {
  const isNightTime = isNight || ambientLight === 'NIGHT';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            Optical Sensor
          </div>
          <h3 className="text-base font-bold text-white font-mono mt-0.5">
            AMBIENT LIGHT (LDR)
          </h3>
        </div>

        <span
          className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border ${
            isNightTime
              ? 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300'
              : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
          }`}
        >
          {isNightTime ? 'NIGHT DETECTED' : 'DAYLIGHT ACTIVE'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div
          className={`p-4 rounded-xl border flex items-center justify-center shrink-0 ${
            isNightTime
              ? 'bg-indigo-950/40 border-indigo-800 text-indigo-400'
              : 'bg-amber-950/40 border-amber-800 text-amber-400'
          }`}
        >
          {isNightTime ? <Moon className="w-8 h-8" /> : <Sun className="w-8 h-8" />}
        </div>

        <div>
          <div className="text-xl font-bold font-mono text-white">
            {isNightTime ? 'Night Mode Active' : 'Day Mode Active'}
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {isNightTime
              ? 'Physical LDR sensor detects darkness. Street lamps are powered and operating in adaptive motion-sensing mode.'
              : 'Physical LDR sensor detects daylight. All lamps are automatically powered down to eliminate energy waste.'}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
        <span>Sensor: LDR Module (Pin D7)</span>
        <span>Output Logic: LOW = Darkness</span>
      </div>
    </div>
  );
};
