import React from 'react';
import { Calendar, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { formatTime } from '../utils/formatters';

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const CurrentScheduleList = ({ schedules = [] }) => {
  // Determine today's day of week to highlight active row
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // Map and sort schedules by standard week order
  const sortedSchedules = DAYS_ORDER.map((day) => {
    const existing = schedules.find((s) => s.day_of_week.toLowerCase() === day.toLowerCase());
    return (
      existing || {
        day_of_week: day,
        open_time: '08:00:00',
        close_time: '20:00:00',
        enabled: false,
      }
    );
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide uppercase font-mono">
            CURRENT WEEKLY SCHEDULE
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Active 7-day schedule stored in remote node's local NVS memory
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {sortedSchedules.map((item) => {
          const isToday = item.day_of_week.toLowerCase() === todayName.toLowerCase();
          const isEnabled = item.enabled;

          return (
            <div
              key={item.day_of_week}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isToday
                  ? 'bg-slate-800/90 border-cyan-500/50 shadow-sm'
                  : 'bg-slate-950/40 border-slate-850 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isEnabled ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                <span
                  className={`font-mono text-sm font-semibold ${
                    isToday ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {item.day_of_week}
                </span>
                {isToday && (
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                    Today
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                {isEnabled ? (
                  <div className="flex items-center gap-2 font-mono text-sm text-slate-200">
                    <span className="font-semibold text-emerald-400">
                      {formatTime(item.open_time)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-semibold text-rose-400">
                      {formatTime(item.close_time)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-mono text-slate-500 uppercase">
                    Disabled
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
