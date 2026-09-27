import React, { useEffect } from 'react';
import { X, WifiOff, CheckCircle2, Cpu, Radio, ExternalLink } from 'lucide-react';

export const ConnectDeviceModal = ({
  isOpen,
  onClose,
  deviceId = 'LED-001',
  isOnline = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
            <WifiOff className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-wide">
                Device Is Not Connected
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                isOnline
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-rose-950 text-rose-300 border-rose-700'
              }`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Target node <span className="font-mono text-white font-bold">{deviceId}</span> has not established an active telemetry heartbeat with the platform.
            </p>
          </div>
        </div>

        {/* Steps to Connect */}
        <div className="space-y-3 font-mono text-xs">
          <div className="text-slate-300 font-bold uppercase text-[11px] tracking-wider mb-2">
            How to connect your physical ESP32:
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">1</span>
              <span>Open the ESP32 Firmware Sketch</span>
            </div>
            <p className="text-slate-400 text-[11px] pl-7 font-sans">
              Open <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">gate-control/esp32-single-led/esp32_single_led.ino</code> in Arduino IDE.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">2</span>
              <span>Set Your Wi-Fi Name & Password</span>
            </div>
            <p className="text-slate-400 text-[11px] pl-7 font-sans">
              Update lines 27–28 with your 2.4GHz Wi-Fi name & password.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">3</span>
              <span>Plug in USB & Click Upload</span>
            </div>
            <p className="text-slate-400 text-[11px] pl-7 font-sans">
              Select your COM port and upload. Once the board connects, this dialog will update automatically!
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Radio className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>Status: {isOnline ? 'Connected & Ready' : 'Listening on MQTT...'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors border border-slate-700"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
