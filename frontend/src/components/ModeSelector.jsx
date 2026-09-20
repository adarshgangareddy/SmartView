import React from 'react';
import { Clock, Sliders, AlertCircle } from 'lucide-react';

export const ModeSelector = ({ currentMode = 'AUTO', isOnline = true, onSelectMode }) => {
  const isAuto = (currentMode || 'AUTO').toUpperCase() === 'AUTO';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide uppercase font-mono">
            OPERATING MODE
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch between autonomous schedule execution and manual control
          </p>
        </div>

        <span
          className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border ${
            isAuto
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          {isAuto ? 'AUTO SCHEDULE' : 'MANUAL OVERRIDE'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* AUTO Button */}
        <button
          type="button"
          onClick={() => isOnline && onSelectMode('AUTO')}
          disabled={!isOnline}
          className={`p-4 rounded-xl border text-left transition-all ${
            isAuto
              ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/40 shadow-sm'
              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
          } ${!isOnline ? 'cursor-not-allowed opacity-40' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 font-mono font-bold text-sm text-white">
              <Clock className="w-4 h-4 text-cyan-400" />
              AUTO MODE
            </span>
            {isAuto && (
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            ESP32 autonomously operates the gate using its internal RTC and stored 7-day schedule, even during Internet outages.
          </p>
        </button>

        {/* MANUAL Button */}
        <button
          type="button"
          onClick={() => isOnline && onSelectMode('MANUAL')}
          disabled={!isOnline}
          className={`p-4 rounded-xl border text-left transition-all ${
            !isAuto
              ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/40 shadow-sm'
              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
          } ${!isOnline ? 'cursor-not-allowed opacity-40' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 font-mono font-bold text-sm text-white">
              <Sliders className="w-4 h-4 text-amber-400" />
              MANUAL MODE
            </span>
            {!isAuto && (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatic schedule operations are paused. The gate will only open or close via manual operator commands.
          </p>
        </button>
      </div>
    </div>
  );
};
