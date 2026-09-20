import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Synchronizing with remote gateway...' }) => {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-16 h-16 rounded-full border-2 border-slate-800 border-t-emerald-500 animate-spin" />
        <Loader2 className="w-6 h-6 text-emerald-400 absolute" />
      </div>
      <div className="text-base font-bold text-white font-mono tracking-wide">{message}</div>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        Querying gate node status, schedule table, and telemetry parameters...
      </p>
    </div>
  );
};
