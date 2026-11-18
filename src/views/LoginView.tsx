import { useState } from 'react';
import { StaffUser, OperatorSession } from '../types';
import {
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Lock,
  KeyRound,
  Sliders,
  Car,
  UserPlus,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react';
import { ParkPayLogo, ParkPayLogoMark } from '../components/ParkPayLogo';
import { formatTimeIST, formatShiftDuration } from '../utils/fee';

interface LoginViewProps {
  onLogin: (user: StaffUser, preferredView?: 'dashboard' | 'active' | 'history' | 'settings') => void;
  onRegisterStaff?: (user: StaffUser) => void;
  staffList?: StaffUser[];
  lastSession?: OperatorSession | null;
  lotName?: string;
}

export function LoginView({
  onLogin,
  onRegisterStaff,
  staffList = [],
  lastSession,
  lotName,
}: LoginViewProps) {
  // Portal mode: 'operator' for gate attendants, 'admin' for supervisors/management
  const [portal, setPortal] = useState<'operator' | 'admin'>('operator');

  // Operator mode: 'signin' for existing operators, 'register' for newly hired employees
  const [operatorMode, setOperatorMode] = useState<'signin' | 'register'>('signin');

  // Operator sign in form state
  const [operatorEmail, setOperatorEmail] = useState('');
  const [operatorPassword, setOperatorPassword] = useState('');
  const [selectedGate, setSelectedGate] = useState('Gate 1');

  // Employee self-registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGate, setRegGate] = useState('Gate 1');
  const [regPhone, setRegPhone] = useState('');

  // Admin form state (also handles initial admin creation when 0 admins exist)
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [adminStation, setAdminStation] = useState('HQ Central Operations Desk');
  const [showAdminPin, setShowAdminPin] = useState(false);

  // Common UI state
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState('');

  const existingAdmins = staffList.filter((s) => s.role === 'admin');
  const hasAnyAdmin = existingAdmins.length > 0;
  const hasAnyOperator = staffList.some((s) => s.role === 'staff');

  // Operator sign in submission
  const handleOperatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = operatorEmail.trim().toLowerCase();
    const matchedUser = staffList.find(
      (s) => s.email.toLowerCase() === cleanEmail
    );

    if (!matchedUser) {
      setError(
        `No staff account found for ${cleanEmail}. Switch to "Register Employee" to create your account.`
      );
      return;
    }

    if (matchedUser.pin && matchedUser.pin !== operatorPassword.trim()) {
      setError('Incorrect password or PIN. Please check your credentials and try again.');
      return;
    }

    onLogin(
      {
        ...matchedUser,
        gate: selectedGate || matchedUser.gate,
      },
      matchedUser.role === 'admin' ? 'dashboard' : 'active'
    );
  };

  // Employee self-registration submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPassword = regPassword.trim();

    if (!cleanName) {
      setError('Please enter your full legal or employee name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please provide a valid work email address.');
      return;
    }
    if (!cleanPassword) {
      setError('Please set an access PIN or password.');
      return;
    }

    const existing = staffList.find(
      (s) => s.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      setError(`An employee account already exists for ${cleanEmail}. Please switch to Sign In.`);
      return;
    }

    const newEmployee: StaffUser = {
      id: `staff-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: 'staff',
      title: `Lot Operator · ${regGate}`,
      gate: regGate,
      phone: regPhone.trim() || undefined,
      pin: cleanPassword,
      createdAt: new Date().toISOString(),
    };

    if (onRegisterStaff) {
      onRegisterStaff(newEmployee);
    }

    setRegistrationSuccess(`Registered as ${cleanName}! Starting your active shift...`);
    setTimeout(() => {
      onLogin(newEmployee, 'active');
    }, 350);
  };

  // Administrator setup (when no admin exists) or sign in
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = adminEmail.trim().toLowerCase();
    const cleanPin = adminPin.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid administrator email address.');
      return;
    }

    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setError('Please enter a valid 4-digit numeric Security PIN.');
      return;
    }

    if (!hasAnyAdmin) {
      const cleanName = adminName.trim();
      if (!cleanName) {
        setError('Please enter the administrator full name.');
        return;
      }

      const duplicate = staffList.find((s) => s.email.toLowerCase() === cleanEmail);
      if (duplicate) {
        setError(`An operator account already uses ${cleanEmail}. Please use a dedicated admin email.`);
        return;
      }

      const firstAdmin: StaffUser = {
        id: `admin-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        role: 'admin',
        title: `Lot Administrator · ${adminStation}`,
        gate: 'HQ Control',
        pin: cleanPin,
        createdAt: new Date().toISOString(),
      };

      if (onRegisterStaff) {
        onRegisterStaff(firstAdmin);
      }
      onLogin(firstAdmin, 'dashboard');
      return;
    }

    const matchedAdmin = existingAdmins.find(
      (s) => s.email.toLowerCase() === cleanEmail
    );

    if (!matchedAdmin) {
      setError(`No administrator account is registered for ${cleanEmail}.`);
      return;
    }

    if (matchedAdmin.pin && matchedAdmin.pin !== cleanPin) {
      setError('Incorrect 4-digit Security PIN. Please try again.');
      return;
    }

    onLogin(
      {
        ...matchedAdmin,
        title: `Lot Administrator · ${adminStation}`,
      },
      'dashboard'
    );
  };

  // Google SSO Handler
  const handleGoogleSignIn = async (forRole: 'operator' | 'admin') => {
    try {
      setError('');
      const { signInWithGoogle } = await import('../services/gmail');
      const result = await signInWithGoogle();
      if (result?.user) {
        const emailVal = (result.user.email || '').trim().toLowerCase();
        if (!emailVal) {
          setError('Unable to retrieve email address from Google account.');
          return;
        }

        const matchedUser = staffList.find(
          (s) => s.email.toLowerCase() === emailVal
        );

        if (forRole === 'admin') {
          if (matchedUser) {
            if (matchedUser.role !== 'admin') {
              setError(
                `${emailVal} is registered as a Gate Operator. Sign in via the Operator portal or ask an Admin to grant access.`
              );
              return;
            }
            onLogin(matchedUser, 'dashboard');
            return;
          }

          if (!hasAnyAdmin) {
            const firstAdmin: StaffUser = {
              id: result.user.uid,
              name: result.user.displayName || emailVal.split('@')[0],
              email: emailVal,
              role: 'admin',
              title: 'Lot Administrator (Google SSO)',
              gate: 'HQ Control',
              createdAt: new Date().toISOString(),
            };
            if (onRegisterStaff) {
              onRegisterStaff(firstAdmin);
            }
            onLogin(firstAdmin, 'dashboard');
            return;
          }

          setError(
            `${emailVal} is not registered as an Administrator. Ask an existing Admin to add this account in Settings.`
          );
          return;
        }

        // Operator flow
        if (matchedUser) {
          onLogin(
            {
              ...matchedUser,
              gate: matchedUser.role === 'admin' ? matchedUser.gate : selectedGate,
            },
            matchedUser.role === 'admin' ? 'dashboard' : 'active'
          );
          return;
        }

        const newOperator: StaffUser = {
          id: result.user.uid,
          name: result.user.displayName || emailVal.split('@')[0],
          email: emailVal,
          role: 'staff',
          title: `Lot Operator · ${selectedGate}`,
          gate: selectedGate,
          createdAt: new Date().toISOString(),
        };
        if (onRegisterStaff) {
          onRegisterStaff(newOperator);
        }
        onLogin(newOperator, 'active');
      }
    } catch (err: any) {
      const isCancelled =
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        String(err?.message || '').includes('popup-closed-by-user') ||
        String(err?.message || '').includes('cancelled-popup-request');

      if (!isCancelled) {
        setError(err?.message || 'Google sign-in failed. Please try again.');
      }
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
            {portal === 'admin' ? 'Supervisory Control' : 'Gate Terminal'}
          </span>
          <span className="text-neutral-300">/</span>
          <span className={portal === 'admin' ? 'text-amber-800 font-bold' : 'text-emerald-800 font-semibold'}>
            {portal === 'admin' ? 'Admin Portal' : 'Gate Operator Login'}
          </span>
        </div>

        {/* Portal Switcher in Top Bar */}
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
          <div className="flex items-center">
            <ParkPayLogo size="lg" showSubtitle={false} />
          </div>

          {portal === 'operator' ? (
            <div className="space-y-4 max-w-lg">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                <Car className="w-3.5 h-3.5 text-emerald-700" />
                <span>Frontline Gate Operations</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 tracking-tight leading-[1.12]">
                Keep every gate<br />moving.
              </h1>
              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
                Real-time entry ticketing, live lot occupancy tracking, and instant payment receipts synchronized across every booth.
              </p>

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
            <div className="space-y-4 max-w-lg">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded border border-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Supervisory &amp; Control Center</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 tracking-tight leading-[1.12]">
                Lot governance &amp;<br />tariff management.
              </h1>
              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
                Dedicated management console for parking lot directors, tariff controllers, and financial audit personnel.
              </p>

              <div className="space-y-2.5 pt-2 text-xs text-neutral-700">
                <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-neutral-200/80">
                  <Sliders className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-neutral-900">Live Tariff &amp; Capacity Rules</span>
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

          {/* ===================== OPERATOR LOGIN & REGISTRATION FORM ===================== */}
          {portal === 'operator' && (
            <div className="bg-white p-7 sm:p-9 rounded-2xl border border-neutral-200/90 shadow-sm max-w-md w-full mx-auto animate-in fade-in duration-150">
              {/* Header Toggle between Sign In and Register */}
              <div className="mb-5 flex p-1 bg-neutral-100/90 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setOperatorMode('signin');
                    setError('');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    operatorMode === 'signin'
                      ? 'bg-white text-neutral-900 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Operator Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOperatorMode('register');
                    setError('');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    operatorMode === 'register'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-neutral-600 hover:text-emerald-800'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Employee</span>
                </button>
              </div>

              <div className="mb-5 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                    {operatorMode === 'register' ? 'New Staff Onboarding' : 'Booth Terminal'}
                  </div>
                  <h2 className="text-xl font-bold text-neutral-900 leading-tight">
                    {operatorMode === 'register' ? 'Register New Employee' : 'Operator sign in'}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {operatorMode === 'register'
                      ? 'Create your operator account to begin logging shifts & ticketing.'
                      : 'Sign in to commence parking ticketing and shift logging.'}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  {operatorMode === 'register' ? (
                    <UserPlus className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <Car className="w-5 h-5 text-emerald-700" />
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {error}
                </div>
              )}

              {registrationSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{registrationSuccess}</span>
                </div>
              )}

              {/* Handover note from previous real shift */}
              {operatorMode === 'signin' && lastSession && lastSession.logoutTime && (
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

              {/* MODE 1: OPERATOR SIGN IN */}
              {operatorMode === 'signin' && (
                <form onSubmit={handleOperatorSubmit} className="space-y-4">
                  {!hasAnyOperator && (
                    <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200/70 text-[11px] text-emerald-900">
                      No operators registered yet. Use <strong>Register Employee</strong> above or sign in with Google to start your first shift.
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Assigned Gate Booth
                    </label>
                    <select
                      value={selectedGate}
                      onChange={(e) => setSelectedGate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                    >
                      <option value="Gate 1">Gate 1 (Main Entrance &amp; Exit)</option>
                      <option value="Gate 2">Gate 2 (North Express Gate)</option>
                      <option value="Gate 3 (VIP)">Gate 3 (VIP &amp; Monthly Pass)</option>
                      <option value="Gate 4">Gate 4 (Commercial &amp; Bus Entry)</option>
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
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Password / Access PIN
                    </label>
                    <input
                      type="password"
                      value={operatorPassword}
                      onChange={(e) => setOperatorPassword(e.target.value)}
                      required
                      placeholder="Enter your password or PIN"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Start Shift &amp; Sign In</span>
                  </button>

                  <div className="relative my-3 flex items-center justify-center">
                    <div className="border-t border-neutral-200 w-full"></div>
                    <span className="bg-white px-3 text-[11px] text-neutral-400 font-medium uppercase tracking-wider absolute">
                      or
                    </span>
                  </div>

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

                  <div className="pt-3 border-t border-neutral-100 flex flex-col items-center gap-1.5 text-center">
                    <p className="text-xs text-neutral-500">
                      Got a new employee joining the team?
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setOperatorMode('register');
                        setError('');
                      }}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register New Employee Account</span>
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 2: NEW EMPLOYEE REGISTRATION FORM */}
              {operatorMode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      placeholder="Enter employee full name"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Work Email
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Create Password / PIN
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      placeholder="Choose a password or PIN"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Assigned Gate Booth
                    </label>
                    <select
                      value={regGate}
                      onChange={(e) => setRegGate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                    >
                      <option value="Gate 1">Gate 1 (Main Entrance &amp; Exit)</option>
                      <option value="Gate 2">Gate 2 (North Express Gate)</option>
                      <option value="Gate 3 (VIP)">Gate 3 (VIP &amp; Monthly Pass)</option>
                      <option value="Gate 4">Gate 4 (Commercial &amp; Bus Entry)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Mobile Number <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/70 text-[11px] text-emerald-800 leading-relaxed">
                    Registering saves your account to the live staff roster, clocks in your shift timer, and opens the Parking Log.
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register &amp; Start Shift</span>
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setOperatorMode('signin');
                        setError('');
                      }}
                      className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <span>Already registered?</span>
                      <span className="text-emerald-700 font-bold underline">Sign in to your shift</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ===================== DEDICATED ADMIN LOGIN / FIRST-TIME SETUP FORM ===================== */}
          {portal === 'admin' && (
            <div className="bg-white rounded-2xl border-2 border-neutral-900/90 shadow-md max-w-md w-full mx-auto overflow-hidden animate-in fade-in duration-150">
              <div className="bg-neutral-900 px-7 py-5 text-white flex items-center justify-between border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                        {hasAnyAdmin ? 'Level 4 Security' : 'Initial Setup'}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                      {hasAnyAdmin ? 'Administrator Sign In' : 'Create Admin Account'}
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono block">Scope</span>
                  <span className="text-xs text-neutral-200 font-semibold">HQ Control</span>
                </div>
              </div>

              <div className="p-7 sm:p-8 space-y-4">
                <p className="text-xs text-neutral-500">
                  {hasAnyAdmin
                    ? 'Sign in with a registered Administrator account to manage pricing tariffs, revenue analytics, and staff.'
                    : 'No administrator is registered yet. Create the first Administrator account or sign in with Google to initialize control.'}
                </p>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  {!hasAnyAdmin && (
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Administrator Full Name
                      </label>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        required
                        placeholder="Enter administrator name"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 bg-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Administrative Control Scope
                    </label>
                    <select
                      value={adminStation}
                      onChange={(e) => setAdminStation(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 bg-neutral-50 font-medium"
                    >
                      <option value="HQ Central Operations Desk">HQ Central Operations Desk</option>
                      <option value="Tariff & Rate Governance">Tariff &amp; Rate Governance</option>
                      <option value="Financial & Audit Console">Financial &amp; Audit Console</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Administrator Email
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      placeholder="admin@company.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 bg-white"
                    />
                  </div>

                  <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-700" />
                        <span>
                          {hasAnyAdmin ? 'Security PIN (4-Digit)' : 'Set 4-Digit Security PIN'}
                        </span>
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

                    <input
                      type={showAdminPin ? 'text' : 'password'}
                      maxLength={4}
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="••••"
                      className="w-full px-3.5 py-2 rounded-lg border border-amber-300 text-base font-mono font-bold tracking-widest text-center text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 bg-white"
                    />

                    <div className="text-[10px] text-amber-800/80 pt-0.5">
                      {hasAnyAdmin
                        ? 'Enter the 4-digit PIN assigned to your admin account.'
                        : 'You will use this 4-digit PIN for future administrator sign-ins.'}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-1 border border-neutral-900"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>{hasAnyAdmin ? 'Authorize Admin Access' : 'Create Admin & Sign In'}</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </button>

                  <div className="relative my-3 flex items-center justify-center">
                    <div className="border-t border-neutral-200 w-full"></div>
                    <span className="bg-white px-3 text-[11px] text-neutral-400 font-medium uppercase tracking-wider absolute">
                      or
                    </span>
                  </div>

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
                    <span>
                      {hasAnyAdmin ? 'Sign in as Admin with Google' : 'Initialize Admin with Google'}
                    </span>
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
          <span>{lotName || 'ParkPay Parking Management System'}</span>
        </div>
        <div className="text-[11px] text-neutral-400 font-mono">
          {portal === 'admin' ? 'HQ Access' : 'Booth Access'}
        </div>
      </footer>
    </div>
  );
}
