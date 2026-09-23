import { VehicleRecord, LotSettings } from '../types';
import { Printer, X, Download, CheckCircle2 } from 'lucide-react';
import { formatDateIST, formatTimeIST } from '../utils/fee';

interface ReceiptModalProps {
  vehicle: VehicleRecord | null;
  settings: LotSettings;
  onClose: () => void;
}

export function ReceiptModal({ vehicle, settings, onClose }: ReceiptModalProps) {
  if (!vehicle) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const text = `
========================================
           PARKPAY PARKING RECEIPT
========================================
Lot: ${settings.lotName}
Receipt No: ${vehicle.receiptNumber || 'PP-240923-087'}
Date: ${formatDateIST(vehicle.exitTime || new Date())}
Plate No: ${vehicle.plateNumber}
Vehicle Type: ${vehicle.vehicleType}
In-Time: ${formatTimeIST(vehicle.entryTime)}
Out-Time: ${vehicle.exitTime ? formatTimeIST(vehicle.exitTime) : formatTimeIST(new Date())}
Duration: ${vehicle.durationMinutes ? `${Math.floor(vehicle.durationMinutes / 60)}h ${vehicle.durationMinutes % 60}m` : 'N/A'}
Fee: INR ${vehicle.fee}
Payment Status: ${vehicle.paymentStatus.toUpperCase()} (${vehicle.paymentMethod || 'CASH'})
Cashier: ${vehicle.loggedBy}
========================================
    Thank you for parking with ParkPay!
========================================
    `;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${vehicle.plateNumber}_${vehicle.receiptNumber || 'slip'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-sm w-full overflow-hidden flex flex-col">
        {/* Modal Action Bar */}
        <div className="px-5 py-3.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Official Parking Receipt</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Area */}
        <div className="p-6 bg-[#FCFDFB] overflow-y-auto max-h-[75vh]">
          <div
            id="printable-receipt"
            className="bg-white p-5 border border-neutral-200/90 rounded-lg shadow-2xs font-mono text-xs text-neutral-800 space-y-3 leading-relaxed"
          >
            {/* Thermal Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-neutral-300">
              <div className="font-bold text-sm text-neutral-900 tracking-wider">PARKPAY GATE PASS</div>
              <div className="text-[11px] font-sans text-neutral-600 font-medium">{settings.lotName}</div>
              <div className="text-[10px] text-neutral-400">GSTIN / TAX: 17AABCP1234F1Z8</div>
            </div>

            {/* Receipt metadata */}
            <div className="text-[11px] space-y-1 pt-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Receipt No:</span>
                <span className="font-bold text-neutral-900">{vehicle.receiptNumber || 'PP-240923-087'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Date:</span>
                <span>{formatDateIST(vehicle.exitTime || new Date())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Operator:</span>
                <span>{vehicle.loggedBy}</span>
              </div>
            </div>

            {/* Vehicle Plate Badge */}
            <div className="py-2.5 my-2 border-y border-dashed border-neutral-300 text-center bg-neutral-50/70 rounded">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">Vehicle Plate</div>
              <div className="text-base font-bold tracking-widest text-neutral-900 font-mono">
                {vehicle.plateNumber}
              </div>
              <div className="text-[11px] text-neutral-600 font-sans mt-0.5">
                {vehicle.vehicleType} {vehicle.ownerPhone ? `· ${vehicle.ownerPhone}` : ''}
              </div>
            </div>

            {/* Timing Breakdown */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Entry Time:</span>
                <span className="font-medium">{formatTimeIST(vehicle.entryTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Exit Time:</span>
                <span className="font-medium">
                  {vehicle.exitTime ? formatTimeIST(vehicle.exitTime) : formatTimeIST(new Date())}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Duration:</span>
                <span className="font-semibold text-neutral-900">
                  {vehicle.durationMinutes
                    ? `${Math.floor(vehicle.durationMinutes / 60)}h ${vehicle.durationMinutes % 60}m`
                    : '1h 48m'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Hourly Base:</span>
                <span>₹{vehicle.rateAppliedAtEntry || settings.hourlyRate}/hr</span>
              </div>
            </div>

            {/* Total Fee Highlight */}
            <div className="pt-2 border-t border-dashed border-neutral-300">
              <div className="flex justify-between items-baseline py-1">
                <span className="text-xs uppercase font-bold text-neutral-700">Total Amount:</span>
                <span className="text-lg font-bold text-neutral-900">₹{vehicle.fee}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-500">Payment Status:</span>
                <span className="font-semibold text-emerald-700">
                  {vehicle.paymentStatus.toUpperCase()} ({vehicle.paymentMethod || 'CASH'})
                </span>
              </div>
            </div>

            {/* Barcode & Verification */}
            <div className="pt-3 border-t border-dashed border-neutral-300 text-center space-y-1">
              <div className="flex justify-center items-center gap-0.5 h-7">
                {[4, 2, 6, 1, 3, 5, 2, 7, 3, 1, 4, 6, 2, 8, 3, 5, 1, 4, 3, 6, 2, 5, 1].map((h, i) => (
                  <span
                    key={i}
                    className="bg-neutral-800 inline-block w-0.5"
                    style={{ height: `${h * 3.2}px` }}
                  ></span>
                ))}
              </div>
              <div className="text-[9px] text-neutral-400 tracking-wider">
                VALIDATED GATE EXIT PASS
              </div>
              <div className="text-[10px] text-neutral-500 font-sans pt-1">
                Keep every gate moving. Drive safely!
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-2">
          <button
            onClick={handleDownload}
            className="px-3 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-md border border-neutral-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download text</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-md hover:bg-neutral-200/50 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
