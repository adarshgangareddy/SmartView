import React from 'react';
import { Radio, Clock, Cpu, Activity, RefreshCw } from 'lucide-react';
import { formatTimeAgo, formatDateTime } from '../utils/formatters';

export const DeviceStatusCard = ({ device, isRefreshing = false, onRefresh }) => {
  const isOnline = device?.status === 'ONLINE';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Device ID</div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              {device?.device_id || 'GATE-001'}
            </div>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
          title="Refresh Status"
          aria-label="Refresh Status"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Device Status */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
          <div className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            Status
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              ></span>
            </span>
            <span
              className={`font-mono font-bold text-sm tracking-wide ${
                isOnline ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {device?.status || 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Last Seen */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
          <div className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Last Seen
          </div>
          <div
            className="font-mono text-sm font-semibold text-slate-200 truncate"
            title={formatDateTime(device?.last_seen)}
          >
            {formatTimeAgo(device?.last_seen)}
          </div>
        </div>

        {/* Mode */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
          <div className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            Mode
          </div>
          <div className="font-mono text-sm font-bold text-cyan-400">
            {device?.mode || 'AUTO'}
          </div>
        </div>

        {/* Firmware Version */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
          <div className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            Firmware
          </div>
          <div className="font-mono text-sm font-semibold text-slate-300">
            v{device?.firmware_version || '1.0.0'}
          </div>
        </div>
      </div>
    </div>
  );
};
