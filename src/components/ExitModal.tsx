import { useState, useMemo } from 'react';
import { VehicleRecord, LotSettings, PaymentMethod, PaymentStatus } from '../types';
import { calculateFee, formatTimeIST } from '../utils/fee';
import { X, Check, Banknote, QrCode, CreditCard, ArrowRight, ShieldCheck } from 'lucide-react';

interface ExitModalProps {
  vehicle: VehicleRecord | null;
  settings: LotSettings;
  onConfirm: (
    vehicle: VehicleRecord,
    paymentMethod: PaymentMethod,
    paymentStatus: PaymentStatus,
    openReceipt: boolean
  ) => void;
  onClose: () => void;
}

export function ExitModal({ vehicle, settings, onConfirm, onClose }: ExitModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [showQrSimulation, setShowQrSimulation] = useState(false);

  const exitTime = useMemo(() => new Date().toISOString(), []);

  const feeDetails = useMemo(() => {
    if (!vehicle) return null;
    return calculateFee(vehicle.entryTime, exitTime, {
      hourlyRate: vehicle.rateAppliedAtEntry || settings.hourlyRate,
      minimumCharge: vehicle.minimumChargeAtEntry || settings.minimumCharge,
      gracePeriodMinutes: vehicle.graceMinutesAtEntry || settings.gracePeriodMinutes,
      vehicleType: vehicle.vehicleType,
      multipliers: settings.multipliers,
    });
  }, [vehicle, exitTime, settings]);

  if (!vehicle || !feeDetails) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-[#FAFBF9]">
          <div>
            <h2 className="text-base font-bold text-neutral-900 leading-tight">Process Gate Exit</h2>
            <p className="text-xs text-neutral-500">Calculate fee and complete checkout</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-5">
          {/* Plate & Type Banner */}
          <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                License Plate
              </span>
              <div className="font-mono text-xl font-bold text-neutral-900 tracking-wider">
                {vehicle.plateNumber}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-white text-xs font-semibold text-neutral-700 border border-emerald-200">
                {vehicle.vehicleType}
              </span>
              {vehicle.ownerPhone && (
                <div className="text-[11px] text-neutral-500 mt-1">{vehicle.ownerPhone}</div>
              )}
            </div>
          </div>

          {/* Time & Duration Grid */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-100 text-xs text-center">
            <div>
              <div className="text-neutral-400 text-[10px] uppercase font-medium">Entry Time</div>
              <div className="font-semibold text-neutral-800 font-mono mt-0.5">
                {formatTimeIST(vehicle.entryTime)}
              </div>
            </div>
            <div>
              <div className="text-neutral-400 text-[10px] uppercase font-medium">Exit Time</div>
              <div className="font-semibold text-neutral-800 font-mono mt-0.5">
                {formatTimeIST(exitTime)}
              </div>
            </div>
            <div>
              <div className="text-neutral-400 text-[10px] uppercase font-medium">Duration</div>
              <div className="font-bold text-emerald-800 font-mono mt-0.5">
                {feeDetails.durationFormatted}
              </div>
            </div>
          </div>

          {/* Fee Calculation Breakdown */}
          <div className="space-y-2 border-t border-b border-neutral-100 py-3 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>Hourly Rate Applied:</span>
              <span className="font-mono">₹{vehicle.rateAppliedAtEntry || settings.hourlyRate}/hr</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Grace Period ({settings.gracePeriodMinutes} mins):</span>
              <span className="font-mono">
                {feeDetails.isGracePeriod ? (
                  <span className="text-emerald-700 font-semibold">Under Grace Period (FREE)</span>
                ) : (
                  'Exceeded'
                )}
              </span>
            </div>
            {settings.multipliers[vehicle.vehicleType] !== 1 && (
              <div className="flex justify-between text-neutral-600">
                <span>Vehicle Type Multiplier:</span>
                <span className="font-mono">{settings.multipliers[vehicle.vehicleType]}x</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-neutral-100">
              <span className="text-sm font-bold text-neutral-900">Total Parking Fee:</span>
              <span className="text-2xl font-bold font-mono text-emerald-800 tabular-nums">
                ₹{feeDetails.finalFee}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['UPI', 'Cash', 'Card'] as PaymentMethod[]).map((method) => {
                const isSelected = paymentMethod === method;
                const icons = {
                  UPI: QrCode,
                  Cash: Banknote,
                  Card: CreditCard,
                };
                const Icon = icons[method];
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method);
                      if (method === 'UPI') setShowQrSimulation(true);
                      else setShowQrSimulation(false);
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/70 text-emerald-900 font-semibold shadow-2xs'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{method}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* UPI QR Simulation Box if UPI selected */}
          {paymentMethod === 'UPI' && showQrSimulation && (
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center gap-3">
              <div className="w-16 h-16 bg-white p-1 rounded border border-neutral-200 shrink-0 flex items-center justify-center">
                {/* SVG mock QR pattern */}
                <svg viewBox="0 0 24 24" className="w-14 h-14 text-neutral-800" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h2v2h-2v-2zm-4-2h2v4h-2v-4zm6 4h2v4h-4v-2h2v-2zm-6 2h2v2h-2v-2zm4-4h2v2h-2v-2z" />
                </svg>
              </div>
              <div className="text-xs">
                <div className="font-semibold text-neutral-900">Scan UPI to pay ₹{feeDetails.finalFee}</div>
                <div className="text-[11px] text-neutral-500">BHIM / GPay / PhonePe / Paytm</div>
                <div className="text-[10px] text-emerald-700 font-mono mt-0.5">parkpay.policebazaar@sbi</div>
              </div>
            </div>
          )}

          {/* Payment Status (Paid / Unpaid) */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-neutral-600 font-medium">Payment status:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('Paid')}
                className={`px-3 py-1 text-xs rounded-md font-medium cursor-pointer transition-colors ${
                  paymentStatus === 'Paid'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Paid now
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('Unpaid')}
                className={`px-3 py-1 text-xs rounded-md font-medium cursor-pointer transition-colors ${
                  paymentStatus === 'Unpaid'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Pay later (Unpaid)
              </button>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(vehicle, paymentMethod, paymentStatus, true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Confirm Exit & Print</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
