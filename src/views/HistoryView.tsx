import { useState, useMemo } from 'react';
import { VehicleRecord, ParkingStatus, PaymentStatus } from '../types';
import { formatTimeIST } from '../utils/fee';
import { exportVehiclesToCSV } from '../utils/storage';
import { Search, Download, Printer, Filter, Check, CheckCircle2, FileSpreadsheet } from 'lucide-react';

interface HistoryViewProps {
  vehicles: VehicleRecord[];
  onPrintReceipt: (vehicle: VehicleRecord) => void;
  onMarkPaid: (vehicleId: string) => void;
}

export function HistoryView({ vehicles, onPrintReceipt, onMarkPaid }: HistoryViewProps) {
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

  const formatDuration = (mins?: number) => {
    if (!mins) return '-';
    const hrs = Math.floor(mins / 60);
    const remainder = mins % 60;
    return hrs > 0 ? `${hrs}h ${remainder}m` : `${remainder}m`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* View Header with direct CSV Download actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">History</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Search and export parking records.</p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAll}
            title="Download full history as CSV"
            className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export All ({vehicles.length})</span>
          </button>

          <button
            onClick={handleExportFiltered}
            title="Download current filtered table as CSV"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV ({filteredVehicles.length})</span>
          </button>
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
                className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 bg-white"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 bg-white"
            >
              <option value="all">All statuses</option>
              <option value="Parked">Parked</option>
              <option value="Exited">Exited</option>
            </select>
          </div>

          {/* From date */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
              From date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 bg-white"
            />
          </div>

          {/* To date */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">To date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 bg-white"
            />
          </div>

          {/* Filter & Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyFilter}
              className="flex-1 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            <button
              onClick={handleExportFiltered}
              className="py-2 px-3 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {appliedFilters.plateQuery && (
          <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span>
              Showing {filteredVehicles.length} records matching filter &quot;
              {appliedFilters.plateQuery}&quot;
            </span>
            <button
              onClick={handleReset}
              className="text-emerald-700 hover:underline font-medium cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* History Data Table */}
      <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 font-semibold text-[11px]">
                <th className="py-3 px-4">Plate</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Entry</th>
                <th className="py-3 px-4">Exit</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Fee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-400">
                    No parking sessions found.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                      {v.plateNumber}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-700">{v.vehicleType}</td>
                    <td className="py-3.5 px-4 font-mono text-neutral-600">
                      {formatTimeIST(v.entryTime)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-600">
                      {v.exitTime ? formatTimeIST(v.exitTime) : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-600">
                      {v.durationMinutes ? formatDuration(v.durationMinutes) : '-'}
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
                      <button
                        onClick={() => onPrintReceipt(v)}
                        className="px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded border border-neutral-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
