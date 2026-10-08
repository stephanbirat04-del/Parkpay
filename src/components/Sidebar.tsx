import { StaffUser, OperatorSession } from '../types';
import { LayoutDashboard, Car, History, Settings, LogOut, Clock, ShieldCheck } from 'lucide-react';
import { ParkPayLogo } from './ParkPayLogo';
import { formatTimeIST, formatShiftDuration } from '../utils/fee';
import { useState, useEffect } from 'react';

interface SidebarProps {
  currentView: 'dashboard' | 'active' | 'history' | 'settings';
  setCurrentView: (view: 'dashboard' | 'active' | 'history' | 'settings') => void;
  currentUser: StaffUser;
  currentSession: OperatorSession | null;
  onSignOut: () => void;
  onOpenShiftDetails?: () => void;
}

export function Sidebar({
  currentView,
  setCurrentView,
  currentUser,
  currentSession,
  onSignOut,
  onOpenShiftDetails,
}: SidebarProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Live elapsed shift timer
  useEffect(() => {
    const updateElapsed = () => {
      if (!currentSession?.loginTime) {
        setElapsedMinutes(0);
        return;
      }
      const loginMs = new Date(currentSession.loginTime).getTime();
      const nowMs = Date.now();
      const diffMin = Math.max(0, Math.floor((nowMs - loginMs) / (1000 * 60)));
      setElapsedMinutes(diffMin);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 30000);
    return () => clearInterval(interval);
  }, [currentSession?.loginTime]);

  const loginTimeFormatted = currentSession?.loginTime
    ? formatTimeIST(currentSession.loginTime)
    : '08:30';

  const navItems: { id: 'dashboard' | 'active' | 'history' | 'settings'; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'active', label: 'Active Lot', icon: Car },
    { id: 'history', label: 'History & Shifts', icon: History },
    ...(currentUser.role === 'admin'
      ? [{ id: 'settings' as const, label: 'Settings', icon: Settings, adminOnly: true }]
      : []),
  ];

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col justify-between h-screen shrink-0 select-none">
      {/* Brand & Nav */}
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center">
          <ParkPayLogo size="md" subtitleText="Gate Operations" />
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-neutral-100/90 text-neutral-900 font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.adminOnly && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800 font-semibold">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Operator profile footer with Shift Timings */}
      <div className="p-4 border-t border-neutral-100 bg-[#FAFBF9] space-y-3">
        {/* Active Shift Timing Badge */}
        <div className="p-2.5 rounded-lg bg-white border border-neutral-200/90 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-600" />
              Shift Timings
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              On Duty
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 text-xs pt-0.5 border-t border-neutral-100">
            <div>
              <div className="text-[10px] text-neutral-400">Login Time</div>
              <div className="font-mono font-semibold text-neutral-800">
                {loginTimeFormatted} <span className="text-[9px] font-sans text-neutral-400">IST</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-400">Active For</div>
              <div className="font-mono font-semibold text-neutral-800">
                {formatShiftDuration(elapsedMinutes)}
              </div>
            </div>
          </div>

          {onOpenShiftDetails && (
            <button
              type="button"
              onClick={onOpenShiftDetails}
              className="w-full text-center text-[10px] font-medium text-emerald-700 hover:text-emerald-800 pt-0.5 hover:underline cursor-pointer block"
            >
              View Shift Details
            </button>
          )}
        </div>

        {/* Operator Identity */}
        <div>
          <div className="text-sm font-semibold text-neutral-900 leading-snug">{currentUser.name}</div>
          <div className="text-xs text-neutral-500 mt-0.5">
            <span>{currentUser.title}</span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-700 hover:text-red-700 hover:bg-red-50/80 rounded-md border border-neutral-200 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-600" />
          <span>End Shift & Sign out</span>
        </button>
      </div>
    </aside>
  );
}
