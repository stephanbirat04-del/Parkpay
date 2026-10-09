import { useState } from 'react';
import { LotSettings, StaffUser } from '../types';
import { INITIAL_STAFF } from '../utils/initialData';
import {
  ShieldAlert,
  CheckCircle2,
  Lock,
  Users,
  UserPlus,
  Trash2,
  Mail,
  Phone,
  Car,
  KeyRound,
  Plus,
  X,
} from 'lucide-react';

interface SettingsViewProps {
  settings: LotSettings;
  currentUser: StaffUser;
  staffList?: StaffUser[];
  onSaveSettings: (newSettings: LotSettings) => void;
  onRegisterStaff?: (newStaff: StaffUser) => void;
  onDeleteStaff?: (staffId: string) => void;
}

export function SettingsView({
  settings,
  currentUser,
  staffList = INITIAL_STAFF,
  onSaveSettings,
  onRegisterStaff,
  onDeleteStaff,
}: SettingsViewProps) {
  const isAdmin = currentUser.role === 'admin';

  const [lotName, setLotName] = useState(settings.lotName);
  const [totalCapacity, setTotalCapacity] = useState(settings.totalCapacity || 60);
  const [hourlyRate, setHourlyRate] = useState(settings.hourlyRate);
  const [minimumCharge, setMinimumCharge] = useState(settings.minimumCharge);
  const [gracePeriod, setGracePeriod] = useState(settings.gracePeriodMinutes);
  const [carMultiplier, setCarMultiplier] = useState(settings.multipliers.Car ?? 1.0);
  const [suvMultiplier, setSuvMultiplier] = useState(settings.multipliers.SUV ?? 1.2);
  const [motoMultiplier, setMotoMultiplier] = useState(settings.multipliers.Motorcycle ?? 0.5);
  const [busMultiplier, setBusMultiplier] = useState(settings.multipliers.Bus ?? 2.0);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Staff management state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffGate, setNewStaffGate] = useState('Gate 1');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');

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
      totalCapacity: Math.max(10, Number(totalCapacity) || 60),
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

  const handleRegisterNewStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setStaffError('');

    const cleanName = newStaffName.trim();
    const cleanEmail = newStaffEmail.trim().toLowerCase();

    if (!cleanName) {
      setStaffError('Please enter employee full name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setStaffError('Please enter a valid email address.');
      return;
    }

    const existing = staffList.find((s) => s.email.toLowerCase() === cleanEmail);
    if (existing) {
      setStaffError(`An employee with email ${cleanEmail} is already registered.`);
      return;
    }

    const newStaff: StaffUser = {
      id: `staff-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: 'staff',
      title: `Lot Operator · ${newStaffGate}`,
      gate: newStaffGate,
      phone: newStaffPhone.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    if (onRegisterStaff) {
      onRegisterStaff(newStaff);
    }

    setStaffSuccess(`Employee "${cleanName}" registered successfully! They can now log in at ${newStaffGate}.`);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPhone('');
    setNewStaffGate('Gate 1');
    setShowAddStaffModal(false);
    setTimeout(() => setStaffSuccess(''), 4000);
  };

  const handleDeleteStaffUser = (staffId: string, name: string) => {
    if (!isAdmin) return;
    if (staffId === currentUser.id) {
      setStaffError('You cannot delete your own logged-in account.');
      return;
    }
    if (confirm(`Are you sure you want to remove employee "${name}"?`)) {
      if (onDeleteStaff) {
        onDeleteStaff(staffId);
      }
      setStaffSuccess(`Employee "${name}" was removed.`);
      setTimeout(() => setStaffSuccess(''), 3000);
    }
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
            {/* Lot name and capacity grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
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

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Total Capacity (spots)
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={totalCapacity}
                  onChange={(e) => setTotalCapacity(Number(e.target.value))}
                  disabled={!isAdmin}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm font-mono text-neutral-900 disabled:bg-neutral-100/70 disabled:text-neutral-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                />
              </div>
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

          {/* Employee & Staff Management Section (Admin Only) */}
          {isAdmin && (
            <div className="bg-white p-6 rounded-xl border border-neutral-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 leading-tight">
                      Staff & Employees
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      {staffList.length} registered accounts
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddStaffModal(true);
                    setStaffError('');
                    setStaffSuccess('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Employee</span>
                </button>
              </div>

              {staffSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{staffSuccess}</span>
                </div>
              )}

              {staffError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {staffError}
                </div>
              )}

              {/* Staff List */}
              <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto pr-1">
                {staffList.map((st) => {
                  const initials = st.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  const isStaffAdmin = st.role === 'admin';
                  const isCurrent = st.id === currentUser.id;

                  return (
                    <div
                      key={st.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                            isStaffAdmin
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-neutral-900 truncate">
                              {st.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] text-neutral-400 font-normal">
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-500 truncate">
                            {st.email}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                            <span className="font-semibold text-neutral-600">
                              {st.gate || 'Gate 1'}
                            </span>
                            {st.phone && <span>· {st.phone}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isStaffAdmin
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {isStaffAdmin ? 'Admin' : 'Employee'}
                        </span>

                        {!isCurrent && !isStaffAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStaffUser(st.id, st.name)}
                            title="Remove Employee"
                            className="p-1 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-[11px] text-neutral-400 leading-normal border-t border-neutral-100">
                Registered employees can sign in at any booth terminal or self-register on the login page.
              </div>
            </div>
          )}

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

      {/* Add New Employee Modal Dialog */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-[#FAFBF9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    Register New Employee
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Add a new parking attendant or gate operator.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterNewStaff} className="p-5 space-y-4">
              {staffError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {staffError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Singhania"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Work Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. vikram@parkpay.in"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Assigned Gate
                  </label>
                  <select
                    value={newStaffGate}
                    onChange={(e) => setNewStaffGate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                  >
                    <option value="Gate 1">Gate 1 (Main)</option>
                    <option value="Gate 2">Gate 2 (North)</option>
                    <option value="Gate 3 (VIP)">Gate 3 (VIP)</option>
                    <option value="Gate 4">Gate 4 (Commercial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/80 text-[11px] text-neutral-600 space-y-1">
                <span className="font-semibold text-neutral-800 block">How registration works:</span>
                <p>
                  The newly added employee is immediately saved into the system. They can log in from the login terminal at their assigned gate to start ticketing and clock their shifts.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Employee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
