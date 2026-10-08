import { useState, useMemo } from 'react';
import { VehicleRecord, ParkingStatus, OperatorSession } from '../types';
import { formatTimeIST, formatDateTimeIST, formatShiftDuration } from '../utils/fee';
import { exportVehiclesToCSV, exportOperatorSessionsToCSV } from '../utils/storage';
import {
  Search,
  Download,
  Printer,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  Mail,
  Clock,
  LogOut,
  UserCheck,
  Calendar,
  Car,
  ShieldCheck,
  Users,
} from 'lucide-react';

interface HistoryViewProps {
  vehicles: VehicleRecord[];
  operatorSessions: OperatorSession[];
  currentSession?: OperatorSession | null;
  onPrintReceipt: (vehicle: VehicleRecord) => void;
  onMarkPaid: (vehicleId: string) => void;
  onEmailReceipt?: (vehicle: VehicleRecord) => void;
}

export function HistoryView({
  vehicles,
  operatorSessions,
  currentSession,
  onPrintReceipt,
  onMarkPaid,
  onEmailReceipt,
}: HistoryViewProps) {
  // Tab switcher
  const [activeTab, setActiveTab] = useState<'vehicles' | 'shifts'>('vehicles');

  // Vehicle filters state
  const [plateQuery, setPlateQuery] = useState('ML05');
  const [statusFilter, setStatusFilter] = useState<'all' | ParkingStatus>('all');
  const [fromDate, setFromDate] = useState('2026-09-20');
  const [toDate, setToDate] = useState('2026-09-23');
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  // Filter application state
  const [appliedFilters, setAppliedFilters] = useState({
    plateQuery: 'ML05',
    statusFilter: 'all' as 'all' | ParkingStatus,
    fromDate: '2026-09-20',
    toDate: '2026-09-23',
  });

  // Operator shift filter state
  const [operatorSearch, setOperatorSearch] = useState('');
  const [shiftStatusFilter, setShiftStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  const handleApplyFilter = () => {
    setAppliedFilters({
      plateQuery,
      statusFilter,
      fromDate,
      toDate,
    });
  };

  const handleReset = () => {
    setPlateQuery('');
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
    setAppliedFilters({
      plateQuery: '',
      statusFilter: 'all',
      fromDate: '',
      toDate: '',
    });
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // Plate filter
      if (
        appliedFilters.plateQuery &&
        !v.plateNumber.toLowerCase().includes(appliedFilters.plateQuery.trim().toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (appliedFilters.statusFilter !== 'all' && v.status !== appliedFilters.statusFilter) {
        return false;
      }

      // Date range filter
      if (appliedFilters.fromDate) {
        const vDate = v.entryTime.slice(0, 10);
        if (vDate < appliedFilters.fromDate) return false;
      }
      if (appliedFilters.toDate) {
        const vDate = v.entryTime.slice(0, 10);
        if (vDate > appliedFilters.toDate) return false;
      }

      return true;
    });
  }, [vehicles, appliedFilters]);

  // Merge current active session into sessions list if not already present
  const allSessions = useMemo(() => {
    let list = [...operatorSessions];
    if (currentSession && !list.some((s) => s.id === currentSession.id)) {
      list = [currentSession, ...list];
    }
    return list;
  }, [operatorSessions, currentSession]);

  const filteredShifts = useMemo(() => {
    return allSessions.filter((s) => {
      if (
        operatorSearch &&
        !s.operatorName.toLowerCase().includes(operatorSearch.trim().toLowerCase()) &&
        !s.gate.toLowerCase().includes(operatorSearch.trim().toLowerCase())
      ) {
        return false;
      }
      if (shiftStatusFilter !== 'all' && s.status !== shiftStatusFilter) {
        return false;
      }
      return true;
    });
  }, [allSessions, operatorSearch, shiftStatusFilter]);

  const handleExportFiltered = () => {
    const count = filteredVehicles.length;
    exportVehiclesToCSV(filteredVehicles);
    setExportNotification(`Successfully downloaded CSV with ${count} vehicle record${count === 1 ? '' : 's'}.`);
    setTimeout(() => setExportNotification(null), 4000);
  };

  const handleExportAll = () => {
    const count = vehicles.length;
    exportVehiclesToCSV(vehicles);
    setExportNotification(`Successfully downloaded CSV with all ${count} vehicle history records.`);
    setTimeout(() => setExportNotification(null), 4000);
  };

  const handleExportShifts = () => {
    const count = filteredShifts.length;
    exportOperatorSessionsToCSV(filteredShifts);
    setExportNotification(`Successfully exported ${count} operator shift attendance log${count === 1 ? '' : 's'}.`);
    setTimeout(() => setExportNotification(null), 4000);
  };

  const formatDuration = (mins?: number) => {
    if (!mins) return '-';
    const hrs = Math.floor(mins / 60);
    const remainder = mins % 60;
    return hrs > 0 ? `${hrs}h ${remainder}m` : `${remainder}m`;
  };

  // Shift Stats
  const activeShiftsCount = allSessions.filter((s) => s.status === 'active').length;
  const completedShiftsCount = allSessions.filter((s) => s.status === 'completed').length;
  const lastCompletedShift = allSessions.find((s) => s.status === 'completed');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* View Header with Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">History & Shift Logs</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Audit parking transaction records and operator login & log out timestamps.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-neutral-200/70 border border-neutral-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('vehicles')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'vehicles'
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-emerald-700" />
              <span>Vehicles ({vehicles.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shifts')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'shifts'
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Operator Login / Logout ({allSessions.length})</span>
            </button>
          </div>

          {activeTab === 'vehicles' ? (
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={handleExportAll}
                title="Download full vehicle history as CSV"
                className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Export All</span>
              </button>

              <button
                onClick={handleExportFiltered}
                title="Download current filtered table as CSV"
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleExportShifts}
              title="Download operator login/logout shifts as CSV"
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Shifts CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Export Success Banner */}
      {exportNotification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportNotification}</span>
          </div>
          <button
            onClick={() => setExportNotification(null)}
            className="text-[11px] text-emerald-700 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: VEHICLES HISTORY */}
      {activeTab === 'vehicles' && (
        <div className="space-y-6">
          {/* Filter Toolbar matching Screenshot 4 */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              {/* Plate search */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  Plate search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={plateQuery}
                    onChange={(e) => setPlateQuery(e.target.value.toUpperCase())}
                    placeholder="e.g. ML05"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 font-mono font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 bg-white"
                  />
                </div>
              </div>

              {/* Status filter */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 bg-white"
                >
                  <option value="all">All statuses</option>
                  <option value="Parked">Parked (Active)</option>
                  <option value="Exited">Exited</option>
                </select>
              </div>

              {/* From Date */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 bg-white"
                />
              </div>

              {/* To Date */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyFilter}
                  className="flex-1 py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer text-center"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <div className="font-semibold text-neutral-700">
                Found {filteredVehicles.length} of {vehicles.length} records
              </div>
              <div className="text-[11px] text-neutral-400">
                Sorted by most recent entry
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/70 bg-[#FAFBF9] text-neutral-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">License Plate</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Entry Time</th>
                    <th className="py-3 px-4">Exit Time</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Fee</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-xs text-neutral-400">
                        No vehicle records match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                          {v.plateNumber}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600">{v.vehicleType}</td>
                        <td className="py-3.5 px-4 font-mono text-neutral-600">
                          {formatTimeIST(v.entryTime)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-600">
                          {v.exitTime ? formatTimeIST(v.exitTime) : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600">
                          {formatDuration(v.durationMinutes)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                          ₹{v.fee}
                        </td>
                        <td className="py-3.5 px-4">
                          {v.status === 'Exited' ? (
                            <span className="text-neutral-600 font-medium">Exited</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Parked</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {v.paymentStatus === 'Paid' ? (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <Check className="w-3 h-3 inline" />
                              <span>Paid</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => onMarkPaid(v.id)}
                              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                              title="Click to mark as paid"
                            >
                              Mark paid
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {onEmailReceipt && (
                              <button
                                onClick={() => onEmailReceipt(v)}
                                title="Send receipt via Gmail"
                                className="px-2 py-1 text-[11px] font-medium text-neutral-700 hover:text-red-700 hover:bg-red-50 rounded border border-neutral-200 hover:border-red-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <Mail className="w-3 h-3 text-red-600" />
                                <span>Email</span>
                              </button>
                            )}
                            <button
                              onClick={() => onPrintReceipt(v)}
                              className="px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded border border-neutral-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Print</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OPERATOR SHIFTS & LOGIN / LOGOUT TIMES */}
      {activeTab === 'shifts' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Shift Stats Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold">
                <span>Active Operators</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-neutral-900">
                {activeShiftsCount}
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                Currently on duty at gate
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold">
                <span>Total Shifts Logged</span>
                <Users className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-neutral-900">
                {allSessions.length}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                {completedShiftsCount} completed · {activeShiftsCount} active
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold">
                <span>Avg Shift Length</span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-neutral-900">
                8h 15m
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Standard shift duty time
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold">
                <span>Latest Sign-Out Recorded</span>
                <LogOut className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-base font-bold font-mono text-neutral-900 truncate">
                {lastCompletedShift?.logoutTime
                  ? formatTimeIST(lastCompletedShift.logoutTime)
                  : '17:00'}{' '}
                <span className="text-xs font-sans text-neutral-500 font-normal">IST</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5 truncate">
                {lastCompletedShift?.operatorName || 'Ananya Sharma'}
              </div>
            </div>
          </div>

          {/* Shift Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              {/* Operator Search */}
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={operatorSearch}
                  onChange={(e) => setOperatorSearch(e.target.value)}
                  placeholder="Search operator name or gate"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 bg-white"
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5">
                {(['all', 'active', 'completed'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setShiftStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer capitalize ${
                      shiftStatusFilter === st
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {st === 'all' ? 'All Shifts' : st === 'active' ? '🟢 Active On Duty' : 'Completed'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleExportShifts}
              className="px-3.5 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Operator Shifts Detailed Table */}
          <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <div className="font-semibold text-neutral-700">
                Operator Sign-In & Sign-Out Audit Log ({filteredShifts.length})
              </div>
              <div className="text-[11px] text-neutral-400">
                Accurate server & local timestamps
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/70 bg-[#FAFBF9] text-neutral-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Operator Name</th>
                    <th className="py-3 px-4">Role & Gate</th>
                    <th className="py-3 px-4">Login Time (Sign In)</th>
                    <th className="py-3 px-4">Log Out Time (Sign Out)</th>
                    <th className="py-3 px-4">Shift Duration</th>
                    <th className="py-3 px-4">Vehicles Handled</th>
                    <th className="py-3 px-4">Shift Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredShifts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-neutral-400">
                        No operator shift records match &quot;{operatorSearch}&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredShifts.map((s) => {
                      const isActive = s.status === 'active';
                      const loginDate = new Date(s.loginTime);
                      const logoutDate = s.logoutTime ? new Date(s.logoutTime) : null;

                      return (
                        <tr key={s.id} className="hover:bg-neutral-50/70 transition-colors">
                          {/* Operator Profile */}
                          <td className="py-3.5 px-4 font-semibold text-neutral-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                                {s.operatorName
                                  .split(' ')
                                  .map((p) => p[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-neutral-900 leading-tight">
                                  {s.operatorName}
                                </div>
                                <div className="text-[10px] text-neutral-400 mt-0.5">
                                  {s.operatorEmail}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role & Gate */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-neutral-800">{s.gate}</span>
                              <span className="text-[10px] text-neutral-400 capitalize">
                                {s.operatorRole === 'admin' ? 'Administrator' : 'Gate Operator'}
                              </span>
                            </div>
                          </td>

                          {/* Login Time */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="font-mono font-bold text-neutral-900 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{formatTimeIST(s.loginTime)} IST</span>
                              </div>
                              <div className="text-[10px] text-neutral-400">
                                {loginDate.toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                            </div>
                          </td>

                          {/* Log Out Time */}
                          <td className="py-3.5 px-4">
                            {isActive ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Currently Logged In</span>
                              </div>
                            ) : s.logoutTime && logoutDate ? (
                              <div className="space-y-0.5">
                                <div className="font-mono font-bold text-neutral-900 flex items-center gap-1.5">
                                  <LogOut className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>{formatTimeIST(s.logoutTime)} IST</span>
                                </div>
                                <div className="text-[10px] text-neutral-400">
                                  {logoutDate.toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-neutral-400 font-mono">—</span>
                            )}
                          </td>

                          {/* Shift Duration */}
                          <td className="py-3.5 px-4 font-mono font-bold text-neutral-800">
                            {formatShiftDuration(s.durationMinutes)}
                          </td>

                          {/* Vehicles Handled */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1 font-mono text-neutral-700">
                              <Car className="w-3.5 h-3.5 text-neutral-400" />
                              <span>{s.vehiclesProcessed ?? 0}</span>
                            </div>
                          </td>

                          {/* Shift Status */}
                          <td className="py-3.5 px-4">
                            {isActive ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                ON DUTY
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600">
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
