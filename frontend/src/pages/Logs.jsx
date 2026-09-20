import React, { useState } from 'react';
import { Header } from '../components/Header';
import { ActivityLog } from '../components/ActivityLog';
import { useDevice } from '../hooks/useDevice';
import { Activity, RefreshCw, Filter } from 'lucide-react';

export const Logs = () => {
  const { device, logs, loading, refresh } = useDevice('GATE-001');
  const [filter, setFilter] = useState('ALL');

  const filteredLogs = logs.filter((l) => {
    if (filter === 'ALL') return true;
    return l.event_type.toUpperCase().includes(filter);
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Header isOnline={device?.status === 'ONLINE'} lastSeen={device?.last_seen} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Title & Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-emerald-400" />
              Audit Trail & Diagnostics
            </div>
            <h1 className="text-2xl font-bold font-mono text-white mt-1">
              SYSTEM ACTIVITY LOGS
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive event history for Node GATE-001
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">All Events</option>
                <option value="GATE" className="bg-slate-900">Gate Movements</option>
                <option value="COMMAND" className="bg-slate-900">Commands</option>
                <option value="SCHEDULE" className="bg-slate-900">Schedule</option>
                <option value="ONLINE" className="bg-slate-900">Connectivity</option>
              </select>
            </div>

            <button
              onClick={refresh}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Full Activity Log */}
        <ActivityLog logs={filteredLogs} limit={100} />
      </main>
    </div>
  );
};
