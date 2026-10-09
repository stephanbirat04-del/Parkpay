import { Mail, Clock } from 'lucide-react';
import { ParkPayLogoMark } from './ParkPayLogo';
import { OperatorSession, StaffUser } from '../types';
import { formatTimeIST } from '../utils/fee';

interface TopBarProps {
  currentView: string;
  googleEmail?: string | null;
  onConnectGoogle?: () => void;
  currentUser?: StaffUser | null;
  currentSession?: OperatorSession | null;
  onOpenShiftDetails?: () => void;
}

export function TopBar({
  currentView,
  googleEmail,
  onConnectGoogle,
  currentUser,
  currentSession,
  onOpenShiftDetails,
}: TopBarProps) {
  const viewLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    active: 'Parking Log',
    history: 'History',
    settings: 'Settings',
  };

  const isAdmin = currentUser?.role === 'admin' || currentSession?.operatorRole === 'admin';

  return (
    <header className="h-12 border-b border-neutral-200/80 bg-[#FAFBF9] px-6 flex items-center justify-between text-xs text-neutral-500 shrink-0 select-none">
      <div className="flex items-center gap-2 font-medium tracking-tight">
        <ParkPayLogoMark className="w-4 h-4" />
        <span className="text-neutral-900 font-bold">ParkPay</span>
        <span className="text-neutral-300">/</span>
        <span className="text-neutral-500">
          {isAdmin ? 'Control HQ' : 'Day Shift'}
        </span>
        {isAdmin && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-[10px] text-amber-900 font-bold border border-amber-200">
            Admin
          </span>
        )}
        {!isAdmin && currentSession?.loginTime && (
          <button
            type="button"
            onClick={onOpenShiftDetails}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer bg-emerald-50 text-emerald-800 border-emerald-200/60 hover:bg-emerald-100/70"
            title="Click to view shift login/logout details"
          >
            <Clock className="w-3 h-3 text-emerald-600" />
            <span>In at {formatTimeIST(currentSession.loginTime)}</span>
          </button>
        )}
        <span className="text-neutral-300">/</span>
        <span className="text-emerald-800 font-semibold">{viewLabels[currentView] || 'Active'}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Gmail status pill */}
        {onConnectGoogle && (
          <button
            onClick={onConnectGoogle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer border ${
              googleEmail
                ? 'bg-red-50/70 border-red-200/80 text-red-900 hover:bg-red-100/60'
                : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
            title={googleEmail ? `Connected as ${googleEmail}` : 'Connect Gmail to send digital receipts'}
          >
            <Mail className="w-3.5 h-3.5 text-red-600" />
            <span>{googleEmail ? googleEmail : 'Connect Gmail'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
