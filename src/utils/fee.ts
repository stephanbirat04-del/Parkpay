import { VehicleType, LotSettings } from '../types';

export function calculateFee(
  entryTimeStr: string,
  exitTimeStr: string,
  settings: {
    hourlyRate: number;
    minimumCharge: number;
    gracePeriodMinutes: number;
    vehicleType?: VehicleType;
    multipliers?: Record<VehicleType, number>;
  }
): {
  durationMinutes: number;
  durationFormatted: string;
  hoursBilled: number;
  isGracePeriod: boolean;
  baseFee: number;
  finalFee: number;
} {
  const entryDate = new Date(entryTimeStr);
  const exitDate = new Date(exitTimeStr);
  
  const diffMs = Math.max(0, exitDate.getTime() - entryDate.getTime());
  const durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

  const hrs = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const durationFormatted = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

  const vehicleType = settings.vehicleType || 'Car';
  const multiplier = settings.multipliers ? (settings.multipliers[vehicleType] ?? 1) : 1;

  if (durationMinutes <= settings.gracePeriodMinutes) {
    return {
      durationMinutes,
      durationFormatted,
      hoursBilled: 0,
      isGracePeriod: true,
      baseFee: 0,
      finalFee: 0,
    };
  }

  // PRD calculation:
  // Math.ceil(durationMinutes / 60) * hourlyRate * multiplier
  // Subject to minimum charge
  const hoursBilled = Math.max(1, Math.ceil(durationMinutes / 60));
  const rawFee = hoursBilled * settings.hourlyRate * multiplier;
  const minCharge = settings.minimumCharge * multiplier;
  const finalFee = Math.max(rawFee, minCharge);

  return {
    durationMinutes,
    durationFormatted,
    hoursBilled,
    isGracePeriod: false,
    baseFee: rawFee,
    finalFee: Math.round(finalFee),
  };
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const randomSeq = Math.floor(100 + Math.random() * 900);
  return `PP-${yy}${mm}${dd}-${randomSeq}`;
}

export function formatTimeIST(dateString?: string | Date): string {
  const d = dateString ? new Date(dateString) : new Date();
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDateIST(dateString?: string | Date): string {
  const d = dateString ? new Date(dateString) : new Date();
  const day = d.getDate();
  const month = d.toLocaleString('en-IN', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDateTimeIST(dateString?: string | Date): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  const day = d.getDate();
  const month = d.toLocaleString('en-IN', { month: 'short' });
  const year = d.getFullYear();
  const time = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${day} ${month} ${year}, ${time} IST`;
}

export function formatShiftDuration(minutes?: number): string {
  if (minutes === undefined || minutes === null || minutes < 0) return '—';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}
