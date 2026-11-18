import { LotSettings } from '../types';

export const DEFAULT_SETTINGS: LotSettings = {
  lotName: 'ParkPay Parking Lot',
  totalCapacity: 60,
  hourlyRate: 50,
  minimumCharge: 30,
  gracePeriodMinutes: 10,
  lastUpdatedBy: '',
  lastUpdatedAt: '',
  upiId: '',
  taxId: '',
  multipliers: {
    Car: 1.0,
    SUV: 1.2,
    Motorcycle: 0.5,
    Bus: 2.0,
    Truck: 2.0,
  },
};

/**
 * Legacy demo document IDs that were previously seeded.
 * Used once to purge demo records from live Firestore and localStorage
 * without affecting any real user-created records.
 */
export const LEGACY_DEMO_STAFF_IDS = ['staff-1', 'staff-2'];

export const LEGACY_DEMO_ACTIVITY_IDS = ['act-1', 'act-2', 'act-3', 'act-4', 'act-5'];

export const LEGACY_DEMO_SESSION_IDS = [
  'sess-today-1',
  'sess-prev-1',
  'sess-prev-2',
  'sess-prev-3',
  'sess-prev-4',
];

export const LEGACY_DEMO_VEHICLE_IDS = [
  'v-act-1',
  'v-act-2',
  'v-act-3',
  'v-act-4',
  'v-act-5',
  'v-act-6',
  'v-act-7',
  'v-act-8',
  'v-act-9',
  'v-act-10',
  ...Array.from({ length: 32 }, (_, i) => `v-act-gen-${i + 11}`),
  'v-hist-1',
  'v-hist-2',
  'v-hist-3',
  'v-hist-4',
  'v-hist-5',
  'v-hist-6',
  'v-hist-7',
];
