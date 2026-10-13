import { useState } from 'react';
import { VehicleRecord, LotSettings } from '../types';
import { Printer, X, Download, CheckCircle2, Mail, FileText, Check, AlertCircle } from 'lucide-react';
import { formatDateIST, formatTimeIST } from '../utils/fee';
import { ParkPayLogoMark } from './ParkPayLogo';
import { jsPDF } from 'jspdf';

interface ReceiptModalProps {
  vehicle: VehicleRecord | null;
  settings: LotSettings;
  onClose: () => void;
  onEmailReceipt?: (vehicle: VehicleRecord) => void;
}

export function ReceiptModal({ vehicle, settings, onClose, onEmailReceipt }: ReceiptModalProps) {
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'info' | 'error'>('info');

  if (!vehicle) return null;

  const durationFormatted = vehicle.durationMinutes
    ? `${Math.floor(vehicle.durationMinutes / 60)}h ${vehicle.durationMinutes % 60}m`
    : '1h 48m';
  const exitTimeFormatted = vehicle.exitTime ? formatTimeIST(vehicle.exitTime) : formatTimeIST(new Date());

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 165],
    });

    const width = 80;
    let y = 10;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text('PARKPAY GATE PASS', width / 2, y, { align: 'center' });
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text(settings.lotName, width / 2, y, { align: 'center' });
    y += 4;

    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('GSTIN / TAX: 17AABCP1234F1Z8', width / 2, y, { align: 'center' });
    y += 4;

    // Dashed separator
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(180, 180, 180);
    doc.line(8, y, width - 8, y);
    y += 4.5;

    // Metadata
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(7.5);
    doc.text('Receipt No:', 8, y);
    doc.setFont('helvetica', 'bold');
    doc.text(vehicle.receiptNumber || 'PP-240923-087', width - 8, y, { align: 'right' });
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.text('Date:', 8, y);
    doc.text(formatDateIST(vehicle.exitTime || new Date()), width - 8, y, { align: 'right' });
    y += 4.5;

    doc.text('Operator:', 8, y);
    doc.text(vehicle.loggedBy || 'Lot Cashier', width - 8, y, { align: 'right' });
    y += 5.5;

    // Vehicle Plate Highlight Box
    doc.setLineDashPattern([], 0);
    doc.setFillColor(246, 248, 246);
    doc.setDrawColor(215, 225, 215);
    doc.roundedRect(8, y, width - 16, 15, 1.5, 1.5, 'FD');

    doc.setFontSize(6.5);
    doc.setTextColor(100, 100, 100);
    doc.text('VEHICLE PLATE', width / 2, y + 4, { align: 'center' });

    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text(vehicle.plateNumber, width / 2, y + 9.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(70, 70, 70);
    doc.text(
      `${vehicle.vehicleType}${vehicle.ownerPhone ? ' · ' + vehicle.ownerPhone : ''}`,
      width / 2,
      y + 13.5,
      { align: 'center' }
    );
    y += 19;

    // Timing Breakdown
    doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    doc.text('Entry Time:', 8, y);
    doc.text(formatTimeIST(vehicle.entryTime), width - 8, y, { align: 'right' });
    y += 4.5;

    doc.text('Exit Time:', 8, y);
    doc.text(exitTimeFormatted, width - 8, y, { align: 'right' });
    y += 4.5;

    doc.text('Duration:', 8, y);
    doc.setFont('helvetica', 'bold');
    doc.text(durationFormatted, width - 8, y, { align: 'right' });
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.text('Hourly Base:', 8, y);
    doc.text(`INR ${vehicle.rateAppliedAtEntry || settings.hourlyRate}/hr`, width - 8, y, { align: 'right' });
    y += 5.5;

    // Fee Section
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(180, 180, 180);
    doc.line(8, y, width - 8, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    doc.text('TOTAL AMOUNT:', 8, y);
    doc.setFontSize(13);
    doc.text(`INR ${vehicle.fee}`, width - 8, y, { align: 'right' });
    y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Payment Status:', 8, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(
      `${vehicle.paymentStatus.toUpperCase()} (${vehicle.paymentMethod || 'CASH'})`,
      width - 8,
      y,
      { align: 'right' }
    );
    y += 7;

    // Barcode Section
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(180, 180, 180);
    doc.line(8, y, width - 8, y);
    y += 4;

    const barcodeHeights = [5, 3, 7, 2, 4, 6, 3, 8, 4, 2, 5, 7, 3, 9, 4, 6, 2, 5, 4, 7, 3, 6, 2];
    const startX = 22;
    const barSpacing = 1.6;
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.6);
    for (let i = 0; i < barcodeHeights.length; i++) {
      doc.line(startX + i * barSpacing, y, startX + i * barSpacing, y + 6);
    }
    y += 9.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    doc.text('VALIDATED GATE EXIT PASS', width / 2, y, { align: 'center' });
    y += 3.5;
    doc.text('Keep every gate moving. Drive safely!', width / 2, y, { align: 'center' });

    return doc;
  };

  const handleDownloadPDF = () => {
    try {
      const doc = generatePDF();
      doc.save(`receipt_${vehicle.plateNumber}_${vehicle.receiptNumber || 'slip'}.pdf`);
      setPrintStatus('Official 80mm PDF Receipt downloaded.');
      setStatusType('success');
      setTimeout(() => setPrintStatus(null), 4000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setPrintStatus('Failed to generate PDF. Please try Text format.');
      setStatusType('error');
    }
  };

  const handlePrint = () => {
    setPrintStatus('Initiating thermal print...');
    setStatusType('info');

    const receiptHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${vehicle.plateNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace;
      width: 76mm;
      margin: 2mm auto;
      padding: 4mm;
      color: #111;
      font-size: 11px;
      line-height: 1.4;
      background: #fff;
    }
    .text-center { text-align: center; }
    .bold { font-weight: bold; }
    .title { font-size: 14px; font-weight: bold; letter-spacing: 1px; margin-bottom: 2px; }
    .subtitle { font-size: 10px; color: #555; }
    .divider { border-bottom: 1px dashed #777; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 10.5px; }
    .plate-box {
      border: 1px solid #ddd;
      background: #f9f9f9;
      padding: 6px;
      text-align: center;
      margin: 8px 0;
      border-radius: 4px;
    }
    .plate { font-size: 16px; font-weight: bold; font-family: monospace; letter-spacing: 1px; }
    .total-row { font-size: 13px; font-weight: bold; margin: 5px 0; }
    .barcode {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.5px;
      height: 24px;
      margin: 6px 0;
    }
    .bar { background: #111; width: 1.5px; display: inline-block; }
    .footer { font-size: 9px; color: #666; text-align: center; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="title">PARKPAY GATE PASS</div>
    <div class="subtitle">${settings.lotName}</div>
    <div class="subtitle" style="font-size: 8px;">GSTIN / TAX: 17AABCP1234F1Z8</div>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span>Receipt No:</span>
    <span class="bold">${vehicle.receiptNumber || 'PP-240923-087'}</span>
  </div>
  <div class="row">
    <span>Date:</span>
    <span>${formatDateIST(vehicle.exitTime || new Date())}</span>
  </div>
  <div class="row">
    <span>Operator:</span>
    <span>${vehicle.loggedBy}</span>
  </div>

  <div class="plate-box">
    <div style="font-size: 9px; color: #666;">VEHICLE PLATE</div>
    <div class="plate">${vehicle.plateNumber}</div>
    <div style="font-size: 10px; color: #555;">${vehicle.vehicleType} ${vehicle.ownerPhone ? '· ' + vehicle.ownerPhone : ''}</div>
  </div>

  <div class="row">
    <span>Entry Time:</span>
    <span>${formatTimeIST(vehicle.entryTime)}</span>
  </div>
  <div class="row">
    <span>Exit Time:</span>
    <span>${exitTimeFormatted}</span>
  </div>
  <div class="row">
    <span>Duration:</span>
    <span class="bold">${durationFormatted}</span>
  </div>
  <div class="row">
    <span>Hourly Base:</span>
    <span>₹${vehicle.rateAppliedAtEntry || settings.hourlyRate}/hr</span>
  </div>

  <div class="divider"></div>

  <div class="row total-row">
    <span>TOTAL AMOUNT:</span>
    <span>₹${vehicle.fee}</span>
  </div>
  <div class="row">
    <span>Payment Status:</span>
    <span class="bold">${vehicle.paymentStatus.toUpperCase()} (${vehicle.paymentMethod || 'CASH'})</span>
  </div>

  <div class="divider"></div>

  <div class="text-center">
    <div class="barcode">
      ${[16, 10, 22, 8, 14, 20, 11, 24, 13, 9, 17, 22, 12, 26, 14, 18, 9, 16, 13, 21, 11, 19, 9]
        .map((h) => `<span class="bar" style="height:${h}px"></span>`)
        .join('')}
    </div>
    <div class="footer bold">VALIDATED GATE EXIT PASS</div>
    <div class="footer">Keep every gate moving. Drive safely!</div>
  </div>
</body>
</html>`;

    let directPrintTriggered = false;

    // Method 1: Print via dedicated hidden iframe (most reliable in web apps)
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('title', 'Receipt Print Window');
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(receiptHtml);
        frameDoc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            directPrintTriggered = true;
            setPrintStatus('Print dialog opened. Ready to print!');
            setStatusType('success');
          } catch (frameErr) {
            console.warn('Iframe print error:', frameErr);
            // Fallback to window.print()
            try {
              window.print();
              directPrintTriggered = true;
              setPrintStatus('Print dialog opened!');
              setStatusType('success');
            } catch (winErr) {
              console.warn('window.print also blocked:', winErr);
              handleDownloadPDF();
              setPrintStatus('Browser blocked printer dialog in iframe. Auto-downloaded PDF receipt!');
              setStatusType('info');
            }
          }
        }, 150);

        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    } catch (err) {
      console.warn('Could not create print iframe, trying window.print():', err);
      try {
        window.print();
        directPrintTriggered = true;
        setPrintStatus('Print dialog opened!');
        setStatusType('success');
      } catch (printErr) {
        console.warn('window.print blocked by iframe sandbox:', printErr);
        handleDownloadPDF();
        setPrintStatus('Printer blocked in iframe view. Generated & downloaded PDF receipt!');
        setStatusType('info');
      }
    }

    // Auto-clear message after 5s
    setTimeout(() => {
      setPrintStatus((prev) => (prev ? null : prev));
    }, 5000);
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
Out-Time: ${exitTimeFormatted}
Duration: ${durationFormatted}
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
    setPrintStatus('Text receipt downloaded.');
    setStatusType('success');
    setTimeout(() => setPrintStatus(null), 3000);
  };

  return (
    <div className="receipt-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="receipt-modal-card bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-sm w-full overflow-hidden flex flex-col">
        {/* Modal Action Bar (no-print) */}
        <div className="no-print px-5 py-3.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
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

        {/* Status notification banner if print/pdf triggered */}
        {printStatus && (
          <div
            className={`no-print px-4 py-2 text-xs flex items-center gap-2 border-b transition-all ${
              statusType === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : statusType === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            {statusType === 'success' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : statusType === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            )}
            <span className="font-medium">{printStatus}</span>
          </div>
        )}

        {/* Printable Thermal Receipt Area */}
        <div className="receipt-modal-content p-6 bg-[#FCFDFB] overflow-y-auto max-h-[72vh]">
          <div
            id="printable-receipt"
            className="bg-white p-5 border border-neutral-200/90 rounded-lg shadow-2xs font-mono text-xs text-neutral-800 space-y-3 leading-relaxed"
          >
            {/* Thermal Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-neutral-300">
              <div className="flex justify-center pb-1">
                <ParkPayLogoMark className="w-6 h-6" />
              </div>
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
                <span className="font-medium">{exitTimeFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Duration:</span>
                <span className="font-semibold text-neutral-900">{durationFormatted}</span>
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

        {/* Modal Action Buttons (no-print) */}
        <div className="no-print p-4 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleDownloadPDF}
              className="px-2.5 py-2 text-xs font-semibold text-neutral-800 hover:text-emerald-800 hover:bg-emerald-50 rounded-md border border-neutral-300 hover:border-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
              title="Download 80mm printable PDF receipt"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>PDF</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-2.5 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-md border border-neutral-300 flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
              title="Download receipt as text slip"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Text</span>
            </button>

            {onEmailReceipt && (
              <button
                onClick={() => onEmailReceipt(vehicle)}
                className="px-2.5 py-2 text-xs font-semibold text-neutral-800 hover:text-red-700 hover:bg-red-50 rounded-md border border-neutral-300 hover:border-red-300 flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
                title="Email receipt via Gmail"
              >
                <Mail className="w-3.5 h-3.5 text-red-600" />
                <span>Gmail</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-md hover:bg-neutral-200/50 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print directly to connected thermal or standard printer"
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
