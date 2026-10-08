import { useState, useEffect } from 'react';
import { OperatorSession, StaffUser } from '../types';
import { Clock, LogOut, X, CheckCircle2, User, Shield, Car, Calendar, FileText } from 'lucide-react';
import { formatDateTimeIST, formatShiftDuration } from '../utils/fee';

interface ShiftSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: StaffUser;
  currentSession: OperatorSession | null;
  onConfirmSignOut: (notes?: string) => void;
  mode?: 'end-shift' | 'view';
}

export function ShiftSummaryModal({
  isOpen,
  onClose,
  currentUser,
  currentSession,
  onConfirmSignOut,
  mode = 'end-shift',
}: ShiftSummaryModalProps) {
  const [currentTimeIso, setCurrentTimeIso] = useState(() => new Date().toISOString());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live timer for accurate logout stamp and elapsed duration calculation
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentTimeIso(new Date().toISOString());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const loginTimeIso = currentSession?.loginTime || new Date().toISOString();
  const loginDate = new Date(loginTimeIso);
  const nowDate = new Date(currentTimeIso);

  const diffMs = Math.max(0, nowDate.getTime() - loginDate.getTime());
  const elapsedMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

  const handleSignOutClick = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmSignOut(notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div
        className="bg-white rounded-2xl max-w-lg w-full border border-neutral-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-[#FAFBF9]">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              mode === 'end-shift' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {mode === 'end-shift' ? <LogOut className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">
                {mode === 'end-shift' ? 'End Shift & Operator Sign Out' : 'Active Operator Shift Timings'}
              </h3>
              <p className="text-xs text-neutral-500">
                {mode === 'end-shift'
                  ? 'Verify shift hours and sign-out time before handing over.'
                  : 'Live on-duty shift tracking and operator timestamps.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Operator Profile Card */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                {currentUser.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <span>{currentUser.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {currentUser.role === 'admin' ? 'Administrator' : 'Gate Operator'}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {currentUser.title} · {currentUser.gate}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>On Duty</span>
              </div>
            </div>
          </div>

          {/* Detailed Timestamps Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Login Time Card */}
            <div className="p-4 rounded-xl border border-neutral-200/90 bg-white space-y-1">
              <div className="flex items-center justify-between text-neutral-500 text-xs">
                <span className="font-semibold text-neutral-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Operator Login Time
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Sign In
                </span>
              </div>
              <div className="text-base font-bold font-mono text-neutral-900 pt-1">
                {loginDate.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                })}{' '}
                <span className="text-xs font-sans text-neutral-500 font-normal">IST</span>
              </div>
              <div className="text-[11px] text-neutral-500">
                {loginDate.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>

            {/* Logout Time Card */}
            <div className="p-4 rounded-xl border border-neutral-200/90 bg-white space-y-1">
              <div className="flex items-center justify-between text-neutral-500 text-xs">
                <span className="font-semibold text-neutral-600 flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5 text-amber-600" />
                  Operator Log Out Time
                </span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  mode === 'end-shift' ? 'text-amber-800 bg-amber-50' : 'text-neutral-600 bg-neutral-100'
                }`}>
                  {mode === 'end-shift' ? 'Recording Now' : 'Pending'}
                </span>
              </div>
              <div className="text-base font-bold font-mono text-neutral-900 pt-1">
                {mode === 'end-shift' ? (
                  <>
                    {nowDate.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                    })}{' '}
                    <span className="text-xs font-sans text-neutral-500 font-normal">IST</span>
                  </>
                ) : (
                  <span className="text-neutral-400 font-normal text-sm italic">— Shift In Progress —</span>
                )}
              </div>
              <div className="text-[11px] text-neutral-500">
                {nowDate.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* Shift Stats Summary Row */}
          <div className="p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/80 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-neutral-500 font-medium">Total Shift Duration</div>
              <div className="text-lg font-bold font-mono text-neutral-900 mt-0.5">
                {formatShiftDuration(elapsedMinutes)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                {elapsedMinutes} minutes total on gate
              </div>
            </div>

            <div>
              <div className="text-xs text-neutral-500 font-medium">Vehicles Processed</div>
              <div className="text-lg font-bold font-mono text-neutral-900 mt-0.5 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-emerald-600" />
                <span>{currentSession?.vehiclesProcessed ?? 0}</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Logged during this shift</div>
            </div>
          </div>

          {/* Shift Handover Notes (in end-shift mode) */}
          {mode === 'end-shift' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Handover Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Cash drawer balanced, handed over to next shift operator."
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 resize-none bg-white"
              />
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#FAFBF9] border-t border-neutral-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            {mode === 'end-shift' ? 'Cancel & Keep Working' : 'Close'}
          </button>

          {mode === 'end-shift' ? (
            <button
              type="button"
              onClick={handleSignOutClick}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Log Out...' : 'Confirm Sign Out & Save Shift'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
