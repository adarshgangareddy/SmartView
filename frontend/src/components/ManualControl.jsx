import React, { useState } from 'react';
import { DoorOpen, DoorClosed, Loader2, AlertCircle } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

export const ManualControl = ({
  gateStatus = 'UNKNOWN',
  isOnline = true,
  commandPending = null,
  onOpenGate,
  onCloseGate,
}) => {
  const [modalAction, setModalAction] = useState(null); // 'OPEN' | 'CLOSE' | null

  const isOpening = gateStatus === 'OPENING' || commandPending === 'OPEN';
  const isClosing = gateStatus === 'CLOSING' || commandPending === 'CLOSE';
  const isOpen = gateStatus === 'OPEN';
  const isClosed = gateStatus === 'CLOSED';
  const isDisabled = !isOnline || isOpening || isClosing;

  const handleOpenClick = () => {
    setModalAction('OPEN');
  };

  const handleCloseClick = () => {
    setModalAction('CLOSE');
  };

  const handleConfirmAction = async () => {
    const action = modalAction;
    setModalAction(null);
    if (action === 'OPEN') {
      await onOpenGate();
    } else if (action === 'CLOSE') {
      await onCloseGate();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide uppercase font-mono">
            MANUAL CONTROL
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Direct remote actuator controls with safety confirmation
          </p>
        </div>

        {!isOnline && (
          <span className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/60 border border-rose-800 px-2.5 py-1 rounded-md">
            <AlertCircle className="w-3.5 h-3.5" />
            Locked (Offline)
          </span>
        )}
      </div>

      {commandPending && (
        <div className="mb-4 p-3 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-200 text-xs font-mono flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
          <span>
            Command {commandPending} sent. Awaiting sensor acknowledgement from remote site...
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* OPEN GATE Button */}
        <button
          type="button"
          onClick={handleOpenClick}
          disabled={isDisabled || isOpen}
          className={`flex items-center justify-center gap-3 p-4 rounded-xl font-mono text-sm font-bold uppercase tracking-wider transition-all shadow-md ${
            isDisabled || isOpen
              ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border border-emerald-400/30 hover:shadow-emerald-500/20'
          }`}
        >
          {isOpening ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>OPENING...</span>
            </>
          ) : (
            <>
              <DoorOpen className="w-5 h-5" />
              <span>{isOpen ? 'GATE ALREADY OPEN' : 'OPEN GATE'}</span>
            </>
          )}
        </button>

        {/* CLOSE GATE Button */}
        <button
          type="button"
          onClick={handleCloseClick}
          disabled={isDisabled || isClosed}
          className={`flex items-center justify-center gap-3 p-4 rounded-xl font-mono text-sm font-bold uppercase tracking-wider transition-all shadow-md ${
            isDisabled || isClosed
              ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
              : 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white border border-rose-400/30 hover:shadow-rose-500/20'
          }`}
        >
          {isClosing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>CLOSING...</span>
            </>
          ) : (
            <>
              <DoorClosed className="w-5 h-5" />
              <span>{isClosed ? 'GATE ALREADY CLOSED' : 'CLOSE GATE'}</span>
            </>
          )}
        </button>
      </div>

      <div className="text-xs text-slate-500 mt-4 flex items-center justify-between font-mono">
        <span>Hardware interlock: Active</span>
        <span>Motor travel watchdog: 20s</span>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalAction !== null}
        title={modalAction === 'OPEN' ? 'Open Remote Gate?' : 'Close Remote Gate?'}
        message={
          modalAction === 'OPEN'
            ? 'Are you sure you want to remotely open the gate? Ensure the driveway passage is clear of obstacles.'
            : 'Are you sure you want to remotely close the gate? Ensure no vehicles or pedestrians are in the threshold.'
        }
        confirmText={modalAction === 'OPEN' ? 'Confirm Open' : 'Confirm Close'}
        confirmVariant={modalAction === 'CLOSE' ? 'danger' : 'primary'}
        onConfirm={handleConfirmAction}
        onCancel={() => setModalAction(null)}
      />
    </div>
  );
};
