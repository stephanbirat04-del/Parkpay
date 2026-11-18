import { useState, useEffect } from 'react';
import { LotSettings, StaffUser } from '../types';
import {
  ShieldAlert,
  CheckCircle2,
  Lock,
  Users,
  UserPlus,
  Trash2,
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
  staffList = [],
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
  const [upiId, setUpiId] = useState(settings.upiId || '');
  const [taxId, setTaxId] = useState(settings.taxId || '');
  const [carMultiplier, setCarMultiplier] = useState(settings.multipliers.Car ?? 1.0);
  const [suvMultiplier, setSuvMultiplier] = useState(settings.multipliers.SUV ?? 1.2);
  const [motoMultiplier, setMotoMultiplier] = useState(settings.multipliers.Motorcycle ?? 0.5);
  const [busMultiplier, setBusMultiplier] = useState(settings.multipliers.Bus ?? 2.0);

  // Keep form synced with live Firestore settings updates
  useEffect(() => {
    setLotName(settings.lotName);
    setTotalCapacity(settings.totalCapacity || 60);
    setHourlyRate(settings.hourlyRate);
    setMinimumCharge(settings.minimumCharge);
    setGracePeriod(settings.gracePeriodMinutes);
    setUpiId(settings.upiId || '');
    setTaxId(settings.taxId || '');
    setCarMultiplier(settings.multipliers.Car ?? 1.0);
    setSuvMultiplier(settings.multipliers.SUV ?? 1.2);
    setMotoMultiplier(settings.multipliers.Motorcycle ?? 0.5);
    setBusMultiplier(settings.multipliers.Bus ?? 2.0);
  }, [settings]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Staff management state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'staff' | 'admin'>('staff');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffGate, setNewStaffGate] = useState('Gate 1');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      lotName: lotName.trim() || 'ParkPay Parking Lot',
      totalCapacity: Math.max(5, Number(totalCapacity) || 60),
      hourlyRate: Number(hourlyRate),
      minimumCharge: Number(minimumCharge),
      gracePeriodMinutes: Number(gracePeriod),
      lastUpdatedBy: currentUser.name,
      lastUpdatedAt: `${formattedDate} · ${currentUser.name}`,
      upiId: upiId.trim(),
      taxId: taxId.trim(),
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
    const cleanPin = newStaffPin.trim();

    if (!cleanName) {
      setStaffError('Please enter employee full name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setStaffError('Please enter a valid email address.');
      return;
    }
    if (newStaffRole === 'admin' && (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin))) {
      setStaffError('Administrators require a 4-digit numeric Security PIN.');
      return;
    }

    const existing = staffList.find((s) => s.email.toLowerCase() === cleanEmail);
    if (existing) {
      setStaffError(`A staff account with email ${cleanEmail} is already registered.`);
      return;
    }

    const newStaff: StaffUser = {
      id: `${newStaffRole === 'admin' ? 'admin' : 'staff'}-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: newStaffRole,
      title: newStaffRole === 'admin' ? 'Lot Administrator' : `Lot Operator · ${newStaffGate}`,
      gate: newStaffRole === 'admin' ? 'HQ Control' : newStaffGate,
      phone: newStaffPhone.trim() || undefined,
      pin: cleanPin || undefined,
      createdAt: new Date().toISOString(),
    };

    if (onRegisterStaff) {
      onRegisterStaff(newStaff);
    }

    setStaffSuccess(
      `${newStaffRole === 'admin' ? 'Administrator' : 'Employee'} "${cleanName}" registered successfully.`
    );
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffRole('staff');
    setNewStaffPin('');
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
    if (confirmDeleteId !== staffId) {
      setConfirmDeleteId(staffId);
      return;
    }
    if (onDeleteStaff) {
      onDeleteStaff(staffId);
    }
    setConfirmDeleteId(null);
    setStaffSuccess(`Removed "${name}" from staff roster.`);
    setTimeout(() => setStaffSuccess(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Settings</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Configure pricing, receipts, and staff access for this lot.</p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Lot and pricing settings updated in real time.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Lot & pricing form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-neutral-200/90 shadow-2xs">
          <div className="mb-6">
            <h2 className="text-base font-bold text-neutral-900">Lot &amp; pricing</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Configure live rates and receipt details for this facility.</p>
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
                  max="5000"
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

            {/* Payment & Tax Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  UPI VPA / Handle <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="merchant@bank"
                  className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 disabled:bg-neutral-100/70 disabled:text-neutral-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  GSTIN / Tax ID <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                  disabled={!isAdmin}
                  placeholder="Printed on receipts if set"
                  className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 disabled:bg-neutral-100/70 disabled:text-neutral-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                />
              </div>
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
              {settings.lastUpdatedAt
                ? `Last updated ${settings.lastUpdatedAt}`
                : 'Using default configuration · Not yet updated'}
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
                      Staff &amp; Employees
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      {staffList.length} registered {staffList.length === 1 ? 'account' : 'accounts'}
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
                  <span>Add Staff</span>
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
                {staffList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-400">
                    No staff accounts registered yet.
                  </div>
                ) : (
                  staffList.map((st) => {
                    const initials = st.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    const isStaffAdmin = st.role === 'admin';
                    const isCurrent = st.id === currentUser.id;
                    const isConfirming = confirmDeleteId === st.id;

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

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStaffUser(st.id, st.name)}
                              onMouseLeave={() => {
                                if (isConfirming) setConfirmDeleteId(null);
                              }}
                              title={isConfirming ? 'Click again to confirm removal' : 'Remove Staff Member'}
                              className={`rounded-md transition-colors cursor-pointer ${
                                isConfirming
                                  ? 'px-2 py-1 text-[10px] font-bold bg-red-600 text-white'
                                  : 'p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                            >
                              {isConfirming ? 'Confirm' : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
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

      {/* Add New Staff Modal Dialog */}
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
                    Register Staff Member
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Add a gate operator or fellow administrator.
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
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStaffRole('staff')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      newStaffRole === 'staff'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                        : 'bg-white border-neutral-200 text-neutral-600'
                    }`}
                  >
                    Gate Operator
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStaffRole('admin')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      newStaffRole === 'admin'
                        ? 'bg-amber-50 border-amber-500 text-amber-950'
                        : 'bg-white border-neutral-200 text-neutral-600'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
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
                  placeholder="name@company.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {newStaffRole === 'admin' ? (
                    <>
                      4-Digit Security PIN <span className="text-red-500">*</span>
                    </>
                  ) : (
                    'Password / Access PIN'
                  )}
                </label>
                <input
                  type="password"
                  maxLength={newStaffRole === 'admin' ? 4 : 32}
                  required={newStaffRole === 'admin'}
                  placeholder={newStaffRole === 'admin' ? '4-digit numeric PIN' : 'Optional initial password'}
                  value={newStaffPin}
                  onChange={(e) =>
                    setNewStaffPin(
                      newStaffRole === 'admin'
                        ? e.target.value.replace(/\D/g, '')
                        : e.target.value
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {newStaffRole === 'staff' && (
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
                )}

                <div className={newStaffRole === 'admin' ? 'col-span-2' : ''}>
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
                  <span>Save Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
