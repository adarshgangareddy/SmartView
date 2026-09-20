import React from 'react';
import {
  Activity,
  DoorOpen,
  DoorClosed,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import { formatTimeAgo, formatDateTime } from '../utils/formatters';

export const ActivityLog = ({ logs = [], limit = 10 }) => {
  const displayedLogs = logs.slice(0, limit);

  const getEventIcon = (eventType = '') => {
    const typeUpper = eventType.toUpperCase();
    if (typeUpper.includes('OPENED') || typeUpper.includes('OPENING')) {
      return <DoorOpen className="w-4 h-4 text-amber-400" />;
    }
    if (typeUpper.includes('CLOSED') || typeUpper.includes('CLOSING')) {
      return <DoorClosed className="w-4 h-4 text-emerald-400" />;
    }
    if (typeUpper.includes('ONLINE')) {
      return <Wifi className="w-4 h-4 text-emerald-400" />;
    }
    if (typeUpper.includes('OFFLINE')) {
      return <WifiOff className="w-4 h-4 text-rose-400" />;
    }
    if (typeUpper.includes('SCHEDULE')) {
      return <Clock className="w-4 h-4 text-cyan-400" />;
    }
    if (typeUpper.includes('MODE')) {
      return <Sliders className="w-4 h-4 text-purple-400" />;
    }
    if (typeUpper.includes('ACKNOWLEDGED')) {
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
    return <Activity className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide uppercase font-mono">
            ACTIVITY & AUDIT LOG
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time event trail streamed from device & backend operations
          </p>
        </div>
      </div>

      {displayedLogs.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm font-mono">
          No recent activity logs found.
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60 font-mono text-xs">
          {displayedLogs.map((log) => (
            <div key={log.id} className="py-3 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                  {getEventIcon(log.event_type)}
                </div>
                <div>
                  <div className="text-slate-200 font-medium">
                    {log.message}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Event: <span className="text-slate-400">{log.event_type}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-slate-400 font-semibold">
                  {formatTimeAgo(log.created_at)}
                </div>
                <div className="text-[10px] text-slate-600">
                  {formatDateTime(log.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
