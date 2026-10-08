import { useState } from 'react';
import { StaffUser, OperatorSession } from '../types';
import { INITIAL_STAFF } from '../utils/initialData';
import {
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Lock,
  KeyRound,
  Sliders,
  Car,
  UserCheck,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ParkPayLogo, ParkPayLogoMark } from '../components/ParkPayLogo';
import { formatTimeIST, formatShiftDuration } from '../utils/fee';

interface LoginViewProps {
  onLogin: (user: StaffUser, preferredView?: 'dashboard' | 'active' | 'history' | 'settings') => void;
  lastSession?: OperatorSession | null;
}

export function LoginView({ onLogin, lastSession }: LoginViewProps) {
  // Portal mode: 'operator' for gate attendants, 'admin' for supervisors/management
  const [portal, setPortal] = useState<'operator' | 'admin'>('operator');

  // Operator form state
  const [operatorEmail, setOperatorEmail] = useState('operator@parkpay.in');
  const [operatorPassword, setOperatorPassword] = useState('••••••••••');
  const [selectedGate, setSelectedGate] = useState('Gate 1');

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('admin@parkpay.in');
  const [adminPassword, setAdminPassword] = useState('••••••••••');
  const [adminPin, setAdminPin] = useState('2026');
  const [adminStation, setAdminStation] = useState('HQ Central Operations Desk');
  const [showAdminPin, setShowAdminPin] = useState(false);

  // Common UI state
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Operator sign in submission
  const handleOperatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const matchedUser = INITIAL_STAFF.find(
      (s) => s.email.toLowerCase() === operatorEmail.trim().toLowerCase()
    );

    if (matchedUser) {
      onLogin({
        ...matchedUser,
        gate: selectedGate,
      }, 'active');
    } else {
      onLogin({
        id: `staff-${Date.now()}`,
        name: 'Ananya Sharma',
        email: operatorEmail,
        role: 'staff',
        title: `Lot Operator · ${selectedGate}`,
        gate: selectedGate,
      }, 'active');
    }
  };

  // Administrator sign in submission
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Security PIN verification (Demo allows 2026 or 1234 or any 4-digit numeric PIN)
    const cleanPin = adminPin.trim();
    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setError('Invalid Master Security PIN. Please enter a 4-digit code (Demo Master PIN: 2026 or 1234).');
      return;
    }

    const matchedUser = INITIAL_STAFF.find(
      (s) => s.email.toLowerCase() === adminEmail.trim().toLowerCase() && s.role === 'admin'
    );

    if (matchedUser) {
      onLogin(matchedUser, 'dashboard');
    } else {
      // Custom administrator credentials
      onLogin({
        id: 'admin-lead',
        name: 'R. Kharkongor',
        email: adminEmail,
        role: 'admin',
        title: `Lot Administrator · ${adminStation}`,
        gate: 'HQ Control',
      }, 'dashboard');
    }
  };

  // Quick 1-click Demo selectors
  const handleSelectDemoOperator = () => {
    setOperatorEmail('operator@parkpay.in');
    setOperatorPassword('••••••••••');
    setSelectedGate('Gate 1');
    setError('');
    onLogin(INITIAL_STAFF[0], 'active');
  };

  const handleSelectDemoAdmin = () => {
    setAdminEmail('admin@parkpay.in');
    setAdminPassword('••••••••••');
    setAdminPin('2026');
    setAdminStation('HQ Central Operations Desk');
    setError('');
    onLogin(INITIAL_STAFF[1], 'dashboard');
  };

  // Google SSO Handler
  const handleGoogleSignIn = async (forRole: 'operator' | 'admin') => {
    try {
      setError('');
      const { signInWithGoogle } = await import('../services/gmail');
      const result = await signInWithGoogle();
      if (result?.user) {
        const emailVal = result.user.email || (forRole === 'admin' ? 'admin@parkpay.in' : 'operator@parkpay.in');
        const isAdmin = forRole === 'admin' || emailVal.toLowerCase().includes('admin') || emailVal === 'stephanbirat04@gmail.com';
        onLogin(
          {
            id: result.user.uid,
            name: result.user.displayName || (isAdmin ? 'R. Kharkongor' : 'Ananya Sharma'),
            email: emailVal,
            role: isAdmin ? 'admin' : 'staff',
            title: isAdmin ? 'Lot Administrator (Google SSO)' : `Lot Operator · ${selectedGate}`,
            gate: isAdmin ? 'HQ Control' : selectedGate,
          },
          isAdmin ? 'dashboard' : 'active'
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFBF9] flex flex-col justify-between select-none">
      {/* Top Header Breadcrumb & Portal Quick Switch */}
      <header className="h-12 px-6 sm:px-10 border-b border-neutral-200/80 bg-[#FAFBF9] flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-2 font-medium tracking-tight">
          <ParkPayLogoMark className="w-4 h-4" />
          <span className="text-neutral-900 font-bold">ParkPay</span>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-500">
            {portal === 'admin' ? 'Supervisory Control' : 'Day Shift'}
          </span>
          <span className="text-neutral-300">/</span>
          <span className={portal === 'admin' ? 'text-amber-800 font-bold' : 'text-emerald-800 font-semibold'}>
            {portal === 'admin' ? 'Admin Portal' : 'Gate Operator Login'}
          </span>
        </div>

        {/* Portal Switcher Pill in Top Bar */}
        <div className="flex items-center gap-2">
          {portal === 'operator' ? (
            <button
              type="button"
              onClick={() => {
                setPortal('admin');
                setError('');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-800 transition-colors cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-3 h-3 text-amber-400" />
              <span>Admin Portal Access</span>
              <ChevronRight className="w-3 h-3 text-amber-400" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setPortal('operator');
                setError('');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white hover:bg-neutral-50 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
            >
              <Car className="w-3 h-3 text-emerald-600" />
              <span>Switch to Operator Login</span>
              <ChevronRight className="w-3 h-3 text-emerald-600" />
            </button>
          )}
        </div>
      </header>

      {/* Main Split Section */}
      <div className="max-w-6xl w-full mx-auto px-6 sm:px-12 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center flex-1">
        {/* Left Column: Brand & Hero Value Proposition */}
        <div className="lg:col-span-7 space-y-7">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center">
            <ParkPayLogo size="lg" showSubtitle={false} />
          </div>

          {/* Dynamic Hero based on Portal */}
          {portal === 'operator' ? (
            /* Operator Hero Context */
            <div className="space-y-4 max-w-lg">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                <Car className="w-3.5 h-3.5 text-emerald-700" />
                <span>Frontline Gate Operations</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 tracking-tight leading-[1.12]">
                Keep every gate<br />moving.
              </h1>
              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
                Fast entry ticketing, live occupancy monitoring, and instant payment receipts for busy parking booths.
              </p>

              {/* Feature Points for Operator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-neutral-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Instant receipt generation with vehicle multiplier math</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Real-time shift login and log out audit trail</span>
                </div>
              </div>
            </div>
          ) : (
            /* Admin Hero Context */
            <div className="space-y-4 max-w-lg">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded border border-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Supervisory & Control Center</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 tracking-tight leading-[1.12]">
                Lot governance &<br />tariff management.
              </h1>
              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
                Dedicated management console for parking lot directors, tariff controllers, and financial audit personnel.
              </p>

              {/* Administrative Capability Pillars */}
              <div className="space-y-2.5 pt-2 text-xs text-neutral-700">
                <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-neutral-200/80">
                  <Sliders className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-neutral-900">Live Tariff & Capacity Rules</span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Adjust base hourly charges, grace period minutes, and vehicle-type rate multipliers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-neutral-200/80">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-neutral-900">Operator Shift Auditing</span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Inspect sign-in timestamps, shift durations, processed vehicle volume, and CSV exports.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Demo Credentials Helpers */}
          <div className="pt-2 max-w-lg">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>One-Click Demo Credentials</span>
              <span className="text-[10px] text-neutral-400 lowercase font-mono">click to auto-authenticate</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleSelectDemoOperator}
                className={`p-3.5 rounded-xl border text-left transition-all group cursor-pointer ${
                  portal === 'operator'
                    ? 'bg-white border-emerald-500/80 shadow-xs ring-1 ring-emerald-500/20'
                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="text-xs font-bold text-neutral-900 group-hover:text-emerald-800 flex items-center justify-between">
                  <span>Ananya Sharma</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold">
                    Operator
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">operator@parkpay.in</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                  <span>Sign in as Operator</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>

              <button
                type="button"
                onClick={handleSelectDemoAdmin}
                className={`p-3.5 rounded-xl border text-left transition-all group cursor-pointer ${
                  portal === 'admin'
                    ? 'bg-neutral-900 border-neutral-800 text-white shadow-xs ring-1 ring-amber-400/40'
                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span className={portal === 'admin' ? 'text-white' : 'text-neutral-900 group-hover:text-amber-800'}>
                    R. Kharkongor
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                    Super Admin
                  </span>
                </div>
                <div className={`text-[11px] mt-0.5 ${portal === 'admin' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  admin@parkpay.in · PIN 2026
                </div>
                <div className={`text-[11px] font-semibold mt-2 flex items-center gap-1 ${portal === 'admin' ? 'text-amber-300' : 'text-amber-800'}`}>
                  <span>Sign in as Admin</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Portal Cards */}
        <div className="lg:col-span-5">
          {/* Segmented Mode Switcher on top of Form */}
          <div className="mb-3.5 bg-neutral-200/70 p-1 rounded-xl flex items-center gap-1 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => {
                setPortal('operator');
                setError('');
              }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                portal === 'operator'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-emerald-600" />
              <span>Gate Operator Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPortal('admin');
                setError('');
              }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                portal === 'admin'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Portal</span>
            </button>
          </div>

          {/* ===================== OPERATOR LOGIN FORM ===================== */}
          {portal === 'operator' && (
            <div className="bg-white p-7 sm:p-9 rounded-2xl border border-neutral-200/90 shadow-sm max-w-md w-full mx-auto animate-in fade-in duration-150">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                    Booth Terminal
                  </div>
                  <h2 className="text-xl font-bold text-neutral-900 leading-tight">Operator sign in</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Sign in to commence parking ticketing and shift logging.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-emerald-700" />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* Handover note from previous shift */}
              {lastSession && lastSession.logoutTime && (
                <div className="mb-5 p-3.5 rounded-xl bg-[#FAFBF9] border border-neutral-200/90 text-xs text-neutral-700 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-neutral-800 text-[10px] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      Last Shift Handover
                    </span>
                    <span className="text-[10px] text-neutral-500 font-semibold px-1.5 py-0.5 bg-neutral-200/70 rounded">
                      Previous Sign-Out
                    </span>
                  </div>
                  <div className="text-neutral-900 font-bold text-xs">
                    {lastSession.operatorName} · {lastSession.gate}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 pt-1.5 border-t border-neutral-200/60 font-mono">
                    <div>
                      <span className="text-[9px] text-neutral-400 font-sans uppercase font-bold block">
                        Login Time
                      </span>
                      <span className="text-neutral-800 font-semibold">
                        {formatTimeIST(lastSession.loginTime)} IST
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-400 font-sans uppercase font-bold block">
                        Log Out Time
                      </span>
                      <span className="text-neutral-800 font-semibold">
                        {formatTimeIST(lastSession.logoutTime)} IST
                      </span>
                    </div>
                  </div>
                  {lastSession.durationMinutes !== undefined && (
                    <div className="text-[10px] text-neutral-500 pt-0.5 flex items-center justify-between">
                      <span>Shift: {formatShiftDuration(lastSession.durationMinutes)}</span>
                      <span>{lastSession.vehiclesProcessed || 0} vehicles processed</span>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleOperatorSubmit} className="space-y-4">
                {/* Gate Selection */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Assigned Gate Booth
                  </label>
                  <select
                    value={selectedGate}
                    onChange={(e) => setSelectedGate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                  >
                    <option value="Gate 1">Gate 1 (Main Entrance & Exit)</option>
                    <option value="Gate 2">Gate 2 (North Express Gate)</option>
                    <option value="Gate 3 (VIP)">Gate 3 (VIP & Monthly Pass)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Operator Email
                  </label>
                  <input
                    type="email"
                    value={operatorEmail}
                    onChange={(e) => setOperatorEmail(e.target.value)}
                    required
                    placeholder="operator@parkpay.in"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={operatorPassword}
                    onChange={(e) => setOperatorPassword(e.target.value)}
                    required
                    placeholder="••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>Start Shift & Sign In</span>
                </button>

                <div className="relative my-3 flex items-center justify-center">
                  <div className="border-t border-neutral-200 w-full"></div>
                  <span className="bg-white px-3 text-[11px] text-neutral-400 font-medium uppercase tracking-wider absolute">
                    or
                  </span>
                </div>

                {/* Google Sign-In button */}
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn('operator')}
                  className="w-full py-2.5 px-4 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg shadow-2xs font-semibold text-xs text-neutral-800 flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span>Sign in as Operator with Google</span>
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setPortal('admin');
                      setError('');
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <span>Parking Supervisor or Director?</span>
                    <span className="text-amber-800 font-bold underline">Go to Admin Portal</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ===================== DEDICATED ADMIN LOGIN FORM ===================== */}
          {portal === 'admin' && (
            <div className="bg-white rounded-2xl border-2 border-neutral-900/90 shadow-md max-w-md w-full mx-auto overflow-hidden animate-in fade-in duration-150">
              {/* Distinctive Executive Header Strip */}
              <div className="bg-neutral-900 px-7 py-5 text-white flex items-center justify-between border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                        Level 4 Security
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                      Administrator Sign In
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono block">Scope</span>
                  <span className="text-xs text-neutral-200 font-semibold">HQ Control</span>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-7 sm:p-8 space-y-4">
                <p className="text-xs text-neutral-500">
                  Elevated authentication required for pricing tariffs, system configurations, and staff oversight.
                </p>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  {/* Administrative Work Station */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Administrative Control Scope
                    </label>
                    <div className="relative">
                      <select
                        value={adminStation}
                        onChange={(e) => setAdminStation(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 bg-neutral-50 font-medium"
                      >
                        <option value="HQ Central Operations Desk">HQ Central Operations Desk</option>
                        <option value="Tariff & Rate Governance">Tariff & Rate Governance</option>
                        <option value="Financial & Audit Console">Financial & Audit Console</option>
                      </select>
                    </div>
                  </div>

                  {/* Admin Work Email */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Administrator Email
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      placeholder="admin@parkpay.in"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 bg-white"
                    />
                  </div>

                  {/* Admin Master Password */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Administrator Password
                    </label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      placeholder="••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 bg-white"
                    />
                  </div>

                  {/* Dedicated 4-Digit Security PIN / 2FA Passcode */}
                  <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Master Security PIN (4-Digit)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAdminPin(!showAdminPin)}
                        className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold cursor-pointer flex items-center gap-1"
                      >
                        {showAdminPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showAdminPin ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type={showAdminPin ? 'text' : 'password'}
                        maxLength={4}
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                        required
                        placeholder="2026"
                        className="w-full px-3.5 py-2 rounded-lg border border-amber-300 text-base font-mono font-bold tracking-widest text-center text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-amber-800/80 pt-0.5">
                      <span>Supervisory secondary verification code</span>
                      <span className="font-mono font-bold bg-amber-100/80 px-1.5 py-0.5 rounded text-amber-900">
                        Demo PIN: 2026
                      </span>
                    </div>
                  </div>

                  {/* Authorize Admin Button */}
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-1 border border-neutral-900"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Authorize Admin Access</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </button>

                  <div className="relative my-3 flex items-center justify-center">
                    <div className="border-t border-neutral-200 w-full"></div>
                    <span className="bg-white px-3 text-[11px] text-neutral-400 font-medium uppercase tracking-wider absolute">
                      or
                    </span>
                  </div>

                  {/* Google Admin Workspace SSO */}
                  <button
                    type="button"
                    onClick={() => handleGoogleSignIn('admin')}
                    className="w-full py-2.5 px-4 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg shadow-2xs font-semibold text-xs text-neutral-800 flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <span>Sign in as Admin with Google</span>
                  </button>

                  <div className="pt-2 text-center border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => {
                        setPortal('operator');
                        setError('');
                      }}
                      className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <span>Standard booth ticketing operator?</span>
                      <span className="text-emerald-800 font-bold underline">Switch to Gate Operator Login</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="px-6 sm:px-12 py-5 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-200/60 bg-white/40">
        <div className="flex items-center gap-2 text-[11px] text-neutral-400">
          <Building2 className="w-3.5 h-3.5" />
          <span>Police Bazaar Parking Management System</span>
          <span className="text-neutral-300">·</span>
          <span>Shillong Municipal Control</span>
        </div>
        <div className="text-[11px] text-neutral-400 font-mono">
          Security Protocol v2.4 · {portal === 'admin' ? 'HQ Access' : 'Booth Access'}
        </div>
      </footer>
    </div>
  );
}
