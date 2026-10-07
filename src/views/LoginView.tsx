import { useState } from 'react';
import { StaffUser } from '../types';
import { INITIAL_STAFF } from '../utils/initialData';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { ParkPayLogo, ParkPayLogoMark } from '../components/ParkPayLogo';

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
          <ParkPayLogoMark className="w-4 h-4" />
          <span className="text-neutral-900 font-bold">ParkPay</span>
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
          <div className="flex items-center">
            <ParkPayLogo size="lg" showSubtitle={false} />
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
                <span>Sign in with Staff ID</span>
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="border-t border-neutral-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] text-neutral-400 font-medium uppercase tracking-wider absolute">
                  or
                </span>
              </div>

              {/* Official Google Sign-In button per Workspace Skill */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    setError('');
                    const { signInWithGoogle } = await import('../services/gmail');
                    const result = await signInWithGoogle();
                    if (result?.user) {
                      const emailVal = result.user.email || 'operator@parkpay.in';
                      const isAdmin = emailVal.toLowerCase().includes('admin') || emailVal === 'stephanbirat04@gmail.com';
                      onLogin({
                        id: result.user.uid,
                        name: result.user.displayName || (isAdmin ? 'R. Kharkongor' : 'Ananya Sharma'),
                        email: emailVal,
                        role: isAdmin ? 'admin' : 'staff',
                        title: isAdmin ? 'Lot Administrator (Google)' : 'Lot Operator (Google)',
                        gate: 'Gate 1',
                      });
                    }
                  } catch (err: any) {
                    setError(err?.message || 'Google sign-in failed. Please try again.');
                  }
                }}
                className="w-full py-2.5 px-4 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg shadow-2xs font-semibold text-xs text-neutral-800 flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>

              <p className="text-[11px] text-neutral-400 text-center pt-2 leading-relaxed">
                Connect your Google account for automated Gmail digital receipts.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="px-6 sm:px-12 py-5 flex items-center justify-end text-xs text-neutral-500">
        <div className="text-[11px] text-neutral-400">
          Police Bazaar Parking · Gate 1
        </div>
      </footer>
    </div>
  );
}
