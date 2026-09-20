import React, { useState } from 'react';
import { Lightbulb, LightbulbOff, Sliders, Loader2, AlertCircle } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

export const StreetLightControls = ({
  isOnline = true,
  currentMode = 'AUTO',
  commandPending = null,
  onTurnOn,
  onTurnOff,
  onSetMode,
}) => {
  const [modalAction, setModalAction] = useState(null); // 'TURN_ON' | 'TURN_OFF' | 'AUTO' | null
  const isAuto = currentMode === 'AUTO';

  const handleConfirmAction = async () => {
    const action = modalAction;
    setModalAction(null);

    if (action === 'TURN_ON') {
      await onTurnOn();
    } else if (action === 'TURN_OFF') {
      await onTurnOff();
    } else if (action === 'AUTO') {
      await onSetMode('AUTO');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide uppercase font-mono">
            STREET LIGHT REMOTE CONTROLS
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manual override actuators and autonomous adaptive mode selector
          </p>
        </div>

        <span
          className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border ${
            isAuto
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          {isAuto ? 'AUTO ADAPTIVE' : 'MANUAL OVERRIDE'}
        </span>
      </div>

      {commandPending && (
        <div className="mb-4 p-3 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-200 text-xs font-mono flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
          <span>
            Command {commandPending} dispatched over MQTT. Awaiting physical node confirmation...
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* TURN ON Button */}
        <button
          type="button"
          onClick={() => setModalAction('TURN_ON')}
          disabled={!isOnline || Boolean(commandPending)}
          className="flex items-center justify-center gap-2.5 p-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-slate-950 border border-amber-400/30 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lightbulb className="w-4 h-4" />
          <span>TURN ALL ON</span>
        </button>

        {/* TURN OFF Button */}
        <button
          type="button"
          onClick={() => setModalAction('TURN_OFF')}
          disabled={!isOnline || Boolean(commandPending)}
          className="flex items-center justify-center gap-2.5 p-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white border border-rose-400/30 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <LightbulbOff className="w-4 h-4" />
          <span>TURN ALL OFF</span>
        </button>

        {/* AUTO ADAPTIVE Button */}
        <button
          type="button"
          onClick={() => setModalAction('AUTO')}
          disabled={!isOnline || isAuto || Boolean(commandPending)}
          className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider border transition-all shadow-md ${
            isAuto
              ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500/30 cursor-default'
              : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white border-slate-700'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>{isAuto ? 'AUTO ACTIVE' : 'ENABLE AUTO'}</span>
        </button>
      </div>

      <div className="text-xs text-slate-500 mt-4 flex items-center justify-between font-mono">
        <span>Sensor Loop: 1x LDR + 4x IR</span>
        <span>PWM Channels: 4 Independently Driven</span>
      </div>

      <ConfirmationModal
        isOpen={modalAction !== null}
        title={
          modalAction === 'TURN_ON'
            ? 'Force All Street Lamps ON?'
            : modalAction === 'TURN_OFF'
            ? 'Force All Street Lamps OFF?'
            : 'Resume Autonomous Mode?'
        }
        message={
          modalAction === 'TURN_ON'
            ? 'This will override daytime/nighttime LDR and IR sensors, setting all 4 lamps to 100% full brightness.'
            : modalAction === 'TURN_OFF'
            ? 'This will turn off all 4 roadway street lamps regardless of ambient darkness or approaching vehicles.'
            : 'This will restore autonomous hardware logic: lamps will illuminate automatically based on darkness and vehicle motion.'
        }
        confirmText={
          modalAction === 'TURN_ON'
            ? 'Confirm Full ON'
            : modalAction === 'TURN_OFF'
            ? 'Confirm Blackout'
            : 'Enable Adaptive'
        }
        confirmVariant={modalAction === 'TURN_OFF' ? 'danger' : 'primary'}
        onConfirm={handleConfirmAction}
        onCancel={() => setModalAction(null)}
      />
    </div>
  );
};
