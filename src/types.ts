export type VehicleType = 'Car' | 'SUV' | 'Motorcycle' | 'Bus' | 'Truck';

export type ParkingStatus = 'Parked' | 'Exited';
export type PaymentStatus = 'Paid' | 'Unpaid';
export type PaymentMethod = 'Cash' | 'UPI' | 'Card';

export interface VehicleRecord {
  id: string;
  plateNumber: string;
  vehicleType: VehicleType;
  ownerPhone?: string;
  entryTime: string; // ISO string
  exitTime?: string; // ISO string
  durationMinutes?: number;
  fee: number;
  status: ParkingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  receiptNumber?: string;
  loggedBy: string;
  rateAppliedAtEntry: number;
  graceMinutesAtEntry: number;
  minimumChargeAtEntry: number;
}

export interface LotSettings {
  lotName: string;
  hourlyRate: number;
  minimumCharge: number;
  gracePeriodMinutes: number;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  multipliers: Record<VehicleType, number>;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'staff' | 'admin';
  title: string;
  gate: string;
}

export interface GateActivityItem {
  id: string;
  timestamp: string;
  timeFormatted: string;
  plateNumber: string;
  action: 'entered' | 'exited';
  vehicleType: VehicleType;
  fee?: number;
}
