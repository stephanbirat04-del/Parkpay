import { useState } from 'react';
import { StaffUser } from '../types';
import { INITIAL_STAFF } from '../utils/initialData';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: StaffUser) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('operator@parkpay.in');
  const [password, setPassword] = useState('••••••••••');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const matchedUser = INITIAL_STAFF.find(
      (s) => s.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (matchedUser) {
      onLogin(matchedUser);
    } else {
      // Allow login as custom staff
      onLogin({
        id: 'staff-operator',
        name: email.includes('admin') ? 'R. Kharkongor' : 'Ananya Sharma',
        email: email,
        role: email.includes('admin') ? 'admin' : 'staff',
        title: email.includes('admin') ? 'Lot Administrator' : 'Lot operator · Gate 1',
        gate: 'Gate 1',
      });
    }
  };

  const handleSelectDemo = (user: StaffUser) => {
    setEmail(user.email);
    setPassword('••••••••••');
    onLogin(user);
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFBF9] flex flex-col justify-between select-none">
      {/* Top Header Breadcrumb matching Screenshot 1 */}
      <header className="h-12 px-6 sm:px-10 border-b border-neutral-200/80 bg-[#FAFBF9] flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-2 font-medium tracking-tight">
          <span className="text-neutral-700">ParkPay</span>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-500">Day Shift</span>
          <span className="text-neutral-300">/</span>
          <span className="text-emerald-800 font-semibold">Login</span>
        </div>
      </header>

      {/* Main Split Section */}
      <div className="max-w-6xl w-full mx-auto px-6 sm:px-12 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center flex-1">
        {/* Left Column: Brand & Hero Value Proposition */}
        <div className="lg:col-span-7 space-y-7">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-lg shadow-xs">
              P
            </div>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">ParkPay</span>
          </div>

          {/* Large Hero Headline */}
          <div className="space-y-4 max-w-lg">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 tracking-tight leading-[1.12]">
              Keep every gate<br />moving.
            </h1>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
              Fast entry, clear occupancy and dependable receipts for busy parking operations.
            </p>
          </div>

          {/* Quick Demo Credentials Helpers */}
          <div className="pt-4 max-w-lg">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
              One-Click Staff Sign-In (Demo)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectDemo(INITIAL_STAFF[0])}
                className="p-3.5 bg-white rounded-xl border border-neutral-200 hover:border-emerald-600 hover:shadow-xs text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-bold text-neutral-900 group-hover:text-emerald-800 flex items-center justify-between">
                  <span>Ananya Sharma</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold">Operator</span>
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">operator@parkpay.in</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                  <span>Sign in as Operator</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemo(INITIAL_STAFF[1])}
                className="p-3.5 bg-white rounded-xl border border-neutral-200 hover:border-emerald-600 hover:shadow-xs text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-bold text-neutral-900 group-hover:text-emerald-800 flex items-center justify-between">
                  <span>R. Kharkongor</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">Admin</span>
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">admin@parkpay.in</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                  <span>Sign in as Admin</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Staff Sign In Form Card */}
        <div className="lg:col-span-5">
          <div className="bg-white p-7 sm:p-9 rounded-2xl border border-neutral-200/90 shadow-sm max-w-md w-full mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-neutral-900 leading-tight">Staff sign in</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Secure access for authorised parking staff.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>Sign in</span>
              </button>

              <p className="text-[11px] text-neutral-400 text-center pt-2 leading-relaxed">
                No sign up · Contact your lot administrator for access.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Status Footer matching Screenshot 1 */}
      <footer className="px-6 sm:px-12 py-5 flex items-center justify-between text-xs text-neutral-500">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 bg-white shadow-2xs text-[11px] text-neutral-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System operational</span>
        </div>

        <div className="text-[11px] text-neutral-400">
          Police Bazaar Parking · Gate 1
        </div>
      </footer>
    </div>
  );
}
