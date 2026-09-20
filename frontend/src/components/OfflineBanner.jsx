import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';

export const OfflineBanner = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div className="bg-rose-950/80 border-b border-rose-800/80 text-rose-200 px-4 py-3 shadow-md backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-rose-900/60 text-rose-400 border border-rose-700/50">
            <WifiOff className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold tracking-wide uppercase text-xs px-2 py-0.5 rounded bg-rose-900 text-rose-300 mr-2">
              DISCONNECTED
            </span>
            <span className="text-sm font-medium">
              Device is currently offline. Remote manual commands are disabled. Physical gate continues autonomous operation using local RTC schedule.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
