import React from 'react';
import { Cpu, HardDrive, Wifi, ShieldCheck, Clock } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

export const DeviceInfo = ({ device }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide uppercase font-mono">
            DEVICE INFORMATION
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical hardware specifications and telemetry
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/60">
          <span className="text-slate-400 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-500" />
            Device Identifier
          </span>
          <span className="font-mono font-bold text-white">
            {device?.device_id || 'GATE-001'}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/60">
          <span className="text-slate-400 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-500" />
            Hardware Architecture
          </span>
          <span className="font-mono text-slate-300">
            ESP32-WROOM-32 (Dual Core 240MHz)
          </span>
        </div>

        <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/60">
          <span className="text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            Hardware RTC Module
          </span>
          <span className="font-mono text-emerald-400">
            DS3231 High-Precision I2C RTC
          </span>
        </div>

        <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/60">
          <span className="text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            Firmware Version
          </span>
          <span className="font-mono text-slate-300">
            v{device?.firmware_version || '1.0.0'}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm py-1.5">
          <span className="text-slate-400 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-slate-500" />
            Last Communication
          </span>
          <span className="font-mono text-xs text-slate-300">
            {formatDateTime(device?.last_seen)}
          </span>
        </div>
      </div>
    </div>
  );
};
