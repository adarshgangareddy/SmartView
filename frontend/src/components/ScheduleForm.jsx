import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { validateSchedule } from '../utils/validators';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ScheduleForm = ({ schedules = [], isOnline = true, onSaveSchedule }) => {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('20:00');
  const [enabled, setEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Sync inputs with existing schedule for the selected day
  useEffect(() => {
    const existing = schedules.find(
      (s) => s.day_of_week.toLowerCase() === selectedDay.toLowerCase()
    );
    if (existing) {
      setOpenTime(existing.open_time ? existing.open_time.substring(0, 5) : '08:00');
      setCloseTime(existing.close_time ? existing.close_time.substring(0, 5) : '20:00');
      setEnabled(existing.enabled !== undefined ? existing.enabled : true);
      setValidationError('');
    }
  }, [selectedDay, schedules]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const validation = validateSchedule(openTime, closeTime);
    if (!validation.valid) {
      setValidationError(validation.message);
      return;
    }

    try {
      setIsSaving(true);
      await onSaveSchedule({
        day_of_week: selectedDay,
        open_time: `${openTime}:00`,
        close_time: `${closeTime}:00`,
        enabled,
      });
    } catch (err) {
      setValidationError(err.message || 'Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide uppercase font-mono">
            SCHEDULE MANAGEMENT
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Update weekly operating hours. Dispatched over MQTT without firmware re-upload.
          </p>
        </div>

        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
          NVS Synced
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Day Selector */}
        <div>
          <label
            htmlFor="schedule-day"
            className="block text-xs font-medium text-slate-300 mb-1.5 uppercase font-mono flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Select Day
          </label>
          <select
            id="schedule-day"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          >
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        {/* Times Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Opening Time */}
          <div>
            <label
              htmlFor="open-time"
              className="block text-xs font-medium text-slate-300 mb-1.5 uppercase font-mono flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Opening Time
            </label>
            <input
              id="open-time"
              type="time"
              value={openTime}
              onChange={(e) => {
                setOpenTime(e.target.value);
                setValidationError('');
              }}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white font-mono text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Closing Time */}
          <div>
            <label
              htmlFor="close-time"
              className="block text-xs font-medium text-slate-300 mb-1.5 uppercase font-mono flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Closing Time
            </label>
            <input
              id="close-time"
              type="time"
              value={closeTime}
              onChange={(e) => {
                setCloseTime(e.target.value);
                setValidationError('');
              }}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white font-mono text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Enabled Checkbox */}
        <div className="flex items-center gap-3 py-1">
          <input
            id="schedule-enabled"
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900"
          />
          <label htmlFor="schedule-enabled" className="text-sm font-medium text-slate-300 cursor-pointer">
            Enable automatic operation on {selectedDay}
          </label>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-mono text-sm font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>SAVING & TRANSMITTING...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>SAVE SCHEDULE</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
