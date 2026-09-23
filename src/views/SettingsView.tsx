import { useState } from 'react';
import { LotSettings, StaffUser } from '../types';
import { ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

interface SettingsViewProps {
  settings: LotSettings;
  currentUser: StaffUser;
  onSaveSettings: (newSettings: LotSettings) => void;
}

export function SettingsView({
  settings,
  currentUser,
  onSaveSettings,
}: SettingsViewProps) {
  const isAdmin = currentUser.role === 'admin';

  const [lotName, setLotName] = useState(settings.lotName);
  const [hourlyRate, setHourlyRate] = useState(settings.hourlyRate);
  const [minimumCharge, setMinimumCharge] = useState(settings.minimumCharge);
  const [gracePeriod, setGracePeriod] = useState(settings.gracePeriodMinutes);
  const [carMultiplier, setCarMultiplier] = useState(settings.multipliers.Car ?? 1.0);
  const [suvMultiplier, setSuvMultiplier] = useState(settings.multipliers.SUV ?? 1.2);
  const [motoMultiplier, setMotoMultiplier] = useState(settings.multipliers.Motorcycle ?? 0.5);
  const [busMultiplier, setBusMultiplier] = useState(settings.multipliers.Bus ?? 2.0);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString('en-US', {
      month: 'short',
    })} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const updated: LotSettings = {
      lotName,
      hourlyRate: Number(hourlyRate),
      minimumCharge: Number(minimumCharge),
      gracePeriodMinutes: Number(gracePeriod),
      lastUpdatedBy: currentUser.name,
      lastUpdatedAt: `${formattedDate} · ${currentUser.name}`,
      multipliers: {
        Car: Number(carMultiplier),
        SUV: Number(suvMultiplier),
        Motorcycle: Number(motoMultiplier),
        Bus: Number(busMultiplier),
        Truck: Number(busMultiplier),
      },
    };

    onSaveSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Settings</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Configure pricing for this lot.</p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Lot and pricing settings updated successfully.</span>
        </div>
      )}

      {/* Two column layout matching Screenshot 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Lot & pricing form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-neutral-200/90 shadow-2xs">
          <div className="mb-6">
            <h2 className="text-base font-bold text-neutral-900">Lot & pricing</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Configure pricing for this lot.</p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Lot name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Lot name
              </label>
              <input
                type="text"
                value={lotName}
                onChange={(e) => setLotName(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-900 disabled:bg-neutral-100/70 disabled:text-neutral-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
              />
            </div>

            {/* Hourly rate & Minimum charge grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Hourly rate (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  disabled={!isAdmin}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm font-mono text-neutral-900 disabled:bg-neutral-100/70 disabled:text-neutral-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Minimum charge (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minimumCharge}
                  onChange={(e) => setMinimumCharge(Number(e.target.value))}
                  disabled={!isAdmin}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm font-mono text-neutral-900 disabled:bg-neutral-100/70 disabled:text-neutral-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                />
              </div>
            </div>

            {/* Grace period */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Grace period (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Number(e.target.value))}
                disabled={!isAdmin}
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm font-mono text-neutral-900 disabled:bg-neutral-100/70 disabled:text-neutral-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Vehicles exiting within grace period are not charged a parking fee.
              </span>
            </div>

            {/* Vehicle Type Multipliers */}
            <div className="pt-2 border-t border-neutral-100">
              <label className="block text-xs font-semibold text-neutral-700 mb-2">
                Vehicle Rate Multipliers
              </label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="text-neutral-500 text-[10px]">Car</div>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={carMultiplier}
                    onChange={(e) => setCarMultiplier(Number(e.target.value))}
                    disabled={!isAdmin}
                    className="w-full mt-1 bg-white px-2 py-1 border rounded text-xs font-mono disabled:bg-neutral-100"
                  />
                </div>
                <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="text-neutral-500 text-[10px]">SUV</div>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={suvMultiplier}
                    onChange={(e) => setSuvMultiplier(Number(e.target.value))}
                    disabled={!isAdmin}
                    className="w-full mt-1 bg-white px-2 py-1 border rounded text-xs font-mono disabled:bg-neutral-100"
                  />
                </div>
                <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="text-neutral-500 text-[10px]">Motorcycle</div>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={motoMultiplier}
                    onChange={(e) => setMotoMultiplier(Number(e.target.value))}
                    disabled={!isAdmin}
                    className="w-full mt-1 bg-white px-2 py-1 border rounded text-xs font-mono disabled:bg-neutral-100"
                  />
                </div>
                <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="text-neutral-500 text-[10px]">Bus / Truck</div>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={busMultiplier}
                    onChange={(e) => setBusMultiplier(Number(e.target.value))}
                    disabled={!isAdmin}
                    className="w-full mt-1 bg-white px-2 py-1 border rounded text-xs font-mono disabled:bg-neutral-100"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isAdmin}
                className={`py-2.5 px-5 rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isAdmin
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                {!isAdmin && <Lock className="w-3.5 h-3.5" />}
                <span>Save settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Admin only information card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#FAFBF9] p-6 rounded-xl border border-neutral-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-neutral-900 text-white tracking-wide">
                Admin only
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-neutral-900 leading-snug">
                Pricing changes affect new entries
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Only administrators can update rates. Existing parked vehicles retain the pricing
                active when they entered.
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-200/70 text-[11px] text-neutral-500 font-medium">
              Last updated {settings.lastUpdatedAt || '18 Sep 2026, 09:24 · R. Kharkongor'}
            </div>
          </div>

          {!isAdmin && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>Operator View Mode (Read-Only)</span>
              </div>
              <p className="text-amber-700 leading-relaxed">
                You are currently signed in as <strong>{currentUser.name}</strong> (Staff Operator).
                Staff members cannot modify pricing or elevate permissions. To adjust rates, please sign out and sign in with an authorized Administrator account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
