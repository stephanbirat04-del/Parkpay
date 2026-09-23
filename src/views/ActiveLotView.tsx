import { useState, useMemo, useEffect } from 'react';
import { VehicleRecord, VehicleType, StaffUser, LotSettings } from '../types';
import { formatTimeIST } from '../utils/fee';
import { Search, Plus, Car, Clock, ArrowRight, Printer, AlertCircle } from 'lucide-react';

interface ActiveLotViewProps {
  vehicles: VehicleRecord[];
  settings: LotSettings;
  currentUser: StaffUser;
  onLogEntry: (plate: string, phone: string, type: VehicleType) => void;
  onProcessExit: (vehicle: VehicleRecord) => void;
  onReprintReceipt: (vehicle: VehicleRecord) => void;
  recentExitVehicle: VehicleRecord | null;
}

export function ActiveLotView({
  vehicles,
  settings,
  currentUser,
  onLogEntry,
  onProcessExit,
  onReprintReceipt,
  recentExitVehicle,
}: ActiveLotViewProps) {
  // Form state
  const [plateNumber, setPlateNumber] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('+91 ');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Car');
  const [formError, setFormError] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | VehicleType>('All');

  // Elapsed time ticker to re-render elapsed times every 30s
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const activeVehicles = useMemo(() => {
    return vehicles.filter((v) => v.status === 'Parked');
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    return activeVehicles.filter((v) => {
      const matchesSearch = v.plateNumber.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesType = typeFilter === 'All' || v.vehicleType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [activeVehicles, searchQuery, typeFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanedPlate = plateNumber.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanedPlate || cleanedPlate.length < 4) {
      setFormError('Please enter a valid license plate (e.g. ML05AB1234)');
      return;
    }

    // Check if vehicle is already parked
    const alreadyParked = activeVehicles.find(
      (v) => v.plateNumber.toUpperCase() === cleanedPlate
    );
    if (alreadyParked) {
      setFormError(`Vehicle ${cleanedPlate} is already registered in the lot.`);
      return;
    }

    onLogEntry(cleanedPlate, ownerPhone.trim() === '+91' ? '' : ownerPhone.trim(), vehicleType);

    // Reset form
    setPlateNumber('');
    setOwnerPhone('+91 ');
  };

  const calculateElapsed = (entryTimeStr: string) => {
    const entryDate = new Date(entryTimeStr);
    const now = new Date();
    const diffMin = Math.max(0, Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60)));
    const hrs = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Active Lot</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Log entries and process exits.</p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: New Vehicle Entry Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-neutral-200/90 shadow-2xs">
          <div className="mb-5">
            <h2 className="text-base font-bold text-neutral-900">New vehicle entry</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Large controls for fast, one hand gate operation.
            </p>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* License Plate */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-neutral-700">
                  License plate
                </label>
                <div className="flex gap-1">
                  {['ML05AB9012', 'AS01CD7844', 'TR01F3319'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setPlateNumber(sample)}
                      className="text-[10px] px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-600 font-mono transition-colors cursor-pointer"
                    >
                      {sample.slice(0, 6)}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="ML05AB1234"
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 text-base font-mono font-bold uppercase tracking-wider text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-neutral-400"
                required
              />
            </div>

            {/* Owner Phone */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Owner phone
              </label>
              <input
                type="tel"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="+91 98630 45192"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm font-mono text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white placeholder:text-neutral-400"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Optional · for instant digital receipt delivery
              </span>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Vehicle type
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
              >
                <option value="Car">Car (Standard rate ₹{settings.hourlyRate}/hr)</option>
                <option value="SUV">SUV (1.2x rate ₹{Math.round(settings.hourlyRate * 1.2)}/hr)</option>
                <option value="Motorcycle">Motorcycle (0.5x rate ₹{Math.round(settings.hourlyRate * 0.5)}/hr)</option>
                <option value="Bus">Bus (2.0x rate ₹{Math.round(settings.hourlyRate * 2.0)}/hr)</option>
                <option value="Truck">Truck (2.0x rate ₹{Math.round(settings.hourlyRate * 2.0)}/hr)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Log entry</span>
            </button>
          </form>
        </div>

        {/* Right Column: Currently Parked List */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-neutral-200/90 shadow-2xs flex flex-col justify-between min-h-[520px]">
          <div>
            {/* Header & Quick Find */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900">
                  Currently parked
                </h2>
                <span className="text-neutral-400">·</span>
                <span className="text-base font-bold font-mono text-emerald-800 tabular-nums">
                  {activeVehicles.length}
                </span>
              </div>

              {/* Quick Find Search */}
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick find · Search plate"
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 bg-neutral-50/50"
                />
              </div>
            </div>

            {/* Vehicle Type Filter Chips */}
            <div className="flex items-center gap-1.5 py-3 overflow-x-auto text-xs">
              {(['All', 'Car', 'SUV', 'Motorcycle', 'Bus', 'Truck'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap text-xs ${
                    typeFilter === t
                      ? 'bg-neutral-800 text-white font-medium shadow-2xs'
                      : 'bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/70'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Vehicle Cards List */}
            <div className="space-y-2.5 mt-1 max-h-[460px] overflow-y-auto pr-1">
              {filteredVehicles.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400">
                  No parked vehicles found matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                filteredVehicles.map((veh) => {
                  const elapsedFormatted = calculateElapsed(veh.entryTime);
                  return (
                    <div
                      key={veh.id}
                      className="p-3.5 rounded-lg border border-neutral-200/80 hover:border-emerald-300 bg-white hover:bg-neutral-50/50 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-sm tracking-wider text-neutral-900">
                          {veh.plateNumber}
                        </div>
                        <div className="text-xs text-neutral-500 flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-neutral-700">{veh.vehicleType}</span>
                          <span>·</span>
                          <span>entered {formatTimeIST(veh.entryTime)}</span>
                          <span>·</span>
                          <span className="font-mono text-emerald-800 font-semibold">
                            elapsed {elapsedFormatted}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onProcessExit(veh)}
                        className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-emerald-800 text-white transition-colors cursor-pointer shrink-0 shadow-2xs"
                      >
                        Process exit
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Exit Notification Banner (matching screenshot 3) */}
      {recentExitVehicle && (
        <div className="p-3.5 bg-white rounded-xl border border-neutral-200/90 shadow-2xs flex items-center justify-between gap-4">
          <div className="text-xs text-neutral-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="font-semibold text-neutral-900">Recent exit</span>
            <span className="text-neutral-400">·</span>
            <span className="font-mono font-bold text-neutral-900">{recentExitVehicle.plateNumber}</span>
            <span className="text-neutral-400">·</span>
            <span className="font-mono font-semibold text-emerald-800">
              ₹{recentExitVehicle.fee} paid
            </span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-500 font-mono">
              Receipt #{recentExitVehicle.receiptNumber || 'PP-240923-087'}
            </span>
          </div>

          <button
            onClick={() => onReprintReceipt(recentExitVehicle)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Reprint receipt</span>
          </button>
        </div>
      )}
    </div>
  );
}
