import React from 'react';
import { ShieldAlert, ShieldCheck, ArrowRightLeft, AlertCircle, HelpCircle, CheckCircle } from 'lucide-react';

export const GateStatusCard = ({ gateStatus = 'UNKNOWN', isOnline = true, commandPending = null }) => {
  // Determine state characteristics
  const statusUpper = (gateStatus || 'UNKNOWN').toUpperCase();

  const configs = {
    OPEN: {
      title: 'Gate OPEN',
      description: 'Perimeter access is fully open. Physical limit switch triggered.',
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      glow: 'shadow-amber-500/5',
      icon: <ShieldAlert className="w-8 h-8 text-amber-400" />,
      accentColor: 'text-amber-400',
      indicatorBg: 'bg-amber-500',
    },
    CLOSED: {
      title: 'Gate CLOSED',
      description: 'Perimeter barrier is secure and fully locked.',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      glow: 'shadow-emerald-500/5',
      icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
      accentColor: 'text-emerald-400',
      indicatorBg: 'bg-emerald-500',
    },
    OPENING: {
      title: 'Gate OPENING',
      description: 'Motor in forward motion. Opening in progress...',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
      glow: 'shadow-cyan-500/10',
      icon: <ArrowRightLeft className="w-8 h-8 text-cyan-400 animate-pulse" />,
      accentColor: 'text-cyan-400',
      indicatorBg: 'bg-cyan-500 animate-ping',
    },
    CLOSING: {
      title: 'Gate CLOSING',
      description: 'Motor in reverse motion. Closing in progress...',
      badgeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
      glow: 'shadow-purple-500/10',
      icon: <ArrowRightLeft className="w-8 h-8 text-purple-400 animate-pulse" />,
      accentColor: 'text-purple-400',
      indicatorBg: 'bg-purple-500 animate-ping',
    },
    UNKNOWN: {
      title: 'Gate Status UNKNOWN',
      description: 'Awaiting sensor synchronization from remote node.',
      badgeBg: 'bg-slate-800 border-slate-700 text-slate-300',
      glow: '',
      icon: <HelpCircle className="w-8 h-8 text-slate-400" />,
      accentColor: 'text-slate-400',
      indicatorBg: 'bg-slate-500',
    },
  };

  const current = configs[statusUpper] || configs.UNKNOWN;

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-lg ${current.glow} relative overflow-hidden`}>
      {/* Background industrial motif grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
            {current.icon}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>

              <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border ${current.badgeBg}`}>
                {statusUpper}
              </span>

              {commandPending && (
                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-700 animate-pulse">
                  COMMAND: {commandPending} PENDING
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
              {current.title}
            </h2>

            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              {current.description}
            </p>
          </div>
        </div>

        {/* Visual Gate Indicator Graphic */}
        <div className="w-full md:w-56 p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-center shrink-0">
          <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">
            Barrier Position
          </div>

          {/* Gate physical schematic visual */}
          <div className="relative w-40 h-16 border-b-2 border-slate-700 flex items-center justify-between px-2">
            {/* Left Gate Post */}
            <div className="w-3 h-14 bg-slate-700 rounded-t flex flex-col justify-between py-1 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            </div>

            {/* Moving Barrier Leaf */}
            <div className="flex-1 flex items-center justify-center px-1 overflow-hidden">
              {statusUpper === 'CLOSED' && (
                <div className="w-full h-8 bg-emerald-600/30 border-2 border-emerald-500 rounded flex items-center justify-center font-mono text-xs font-bold text-emerald-400">
                  LOCKED
                </div>
              )}
              {statusUpper === 'OPEN' && (
                <div className="w-full flex items-center justify-between px-1">
                  <div className="w-3 h-8 bg-amber-500/40 border border-amber-400 rounded" />
                  <span className="text-xs font-mono text-amber-400 font-bold">PASSAGE CLEAR</span>
                  <div className="w-3 h-8 bg-amber-500/40 border border-amber-400 rounded" />
                </div>
              )}
              {statusUpper === 'OPENING' && (
                <div className="w-full h-8 bg-cyan-600/20 border border-dashed border-cyan-400 rounded flex items-center justify-center font-mono text-xs text-cyan-300 animate-pulse">
                  RETRACTING →
                </div>
              )}
              {statusUpper === 'CLOSING' && (
                <div className="w-full h-8 bg-purple-600/20 border border-dashed border-purple-400 rounded flex items-center justify-center font-mono text-xs text-purple-300 animate-pulse">
                  ← EXTENDING
                </div>
              )}
              {statusUpper === 'UNKNOWN' && (
                <div className="w-full h-8 bg-slate-800 border border-slate-700 rounded flex items-center justify-center font-mono text-xs text-slate-400">
                  ---
                </div>
              )}
            </div>

            {/* Right Gate Post */}
            <div className="w-3 h-14 bg-slate-700 rounded-t flex flex-col justify-between py-1 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
