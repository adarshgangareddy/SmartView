import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorState = ({ message = 'Failed to load device information.', onRetry }) => {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-slate-900 border border-slate-800 rounded-xl my-6">
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-white tracking-wide font-mono">
        COMMUNICATION FAULT
      </h3>
      <p className="text-sm text-slate-300 mt-2 max-w-md">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      )}
    </div>
  );
};
