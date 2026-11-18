import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { VehicleRecord, LotSettings, GateActivityItem, OperatorSession, StaffUser } from './types';
import {
  DEFAULT_SETTINGS,
  LEGACY_DEMO_ACTIVITY_IDS,
  LEGACY_DEMO_SESSION_IDS,
  LEGACY_DEMO_STAFF_IDS,
  LEGACY_DEMO_VEHICLE_IDS,
} from './utils/initialData';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with databaseId as required by Skill
export const FIRESTORE_DATABASE_ID =
  (firebaseConfig as Record<string, any>).firestoreDatabaseId ||
  'ai-studio-parkpayparkinglo-86efe5aa-1da6-42a2-acc9-5581887002d9';

export const db = getFirestore(app, FIRESTORE_DATABASE_ID);
export const auth = getAuth(app);

const DEMO_VEHICLE_ID_SET = new Set(LEGACY_DEMO_VEHICLE_IDS);
const DEMO_ACTIVITY_ID_SET = new Set(LEGACY_DEMO_ACTIVITY_IDS);
const DEMO_SESSION_ID_SET = new Set(LEGACY_DEMO_SESSION_IDS);
const DEMO_STAFF_ID_SET = new Set(LEGACY_DEMO_STAFF_IDS);
const DEMO_CLEANUP_FLAG_KEY = 'parkpay_demo_cleanup_v2';

// Connection test on boot per Skill requirement
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    } else {
      console.warn('Firestore connection check notice:', error);
    }
    return false;
  }
}
testConnection();

// Skill-mandated error handling format
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Purge any legacy hardcoded demo documents once from Firestore and ensure
 * clean neutral settings exist without seeding any fake data.
 */
export async function initializeLiveFirestore(): Promise<void> {
  try {
    const settingsRef = doc(db, 'settings', 'current');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, cleanData(DEFAULT_SETTINGS));
    } else {
      const existingSettings = settingsSnap.data() as Partial<LotSettings>;
      if (
        existingSettings.lotName === 'Police Bazaar Parking · Gate 1' &&
        existingSettings.lastUpdatedBy === 'R. Kharkongor'
      ) {
        await setDoc(settingsRef, cleanData(DEFAULT_SETTINGS));
      }
    }

    const alreadyCleaned =
      typeof localStorage !== 'undefined' &&
      localStorage.getItem(DEMO_CLEANUP_FLAG_KEY) === 'done';

    if (!alreadyCleaned) {
      const deletions: Promise<void>[] = [
        ...LEGACY_DEMO_VEHICLE_IDS.map((id) => deleteDoc(doc(db, 'vehicles', id))),
        ...LEGACY_DEMO_ACTIVITY_IDS.map((id) => deleteDoc(doc(db, 'gate_activities', id))),
        ...LEGACY_DEMO_SESSION_IDS.map((id) => deleteDoc(doc(db, 'operator_sessions', id))),
        ...LEGACY_DEMO_STAFF_IDS.map((id) => deleteDoc(doc(db, 'staff_users', id))),
      ];
      await Promise.allSettled(deletions);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(DEMO_CLEANUP_FLAG_KEY, 'done');
      }
    }
  } catch (error) {
    console.warn('Live Firestore initialization notice:', error);
  }
}

/**
 * Real-time Vehicles Listener
 */
export function subscribeToVehicles(
  onData: (vehicles: VehicleRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'vehicles';
  const q = query(collection(db, path));
  return onSnapshot(
    q,
    (snapshot) => {
      const records: VehicleRecord[] = [];
      snapshot.forEach((d) => {
        if (!DEMO_VEHICLE_ID_SET.has(d.id)) {
          records.push({ ...(d.data() as VehicleRecord), id: d.id });
        }
      });
      // Sort newest entry first
      records.sort(
        (a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
      );
      onData(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

/**
 * Real-time Lot Settings Listener
 */
export function subscribeToSettings(
  onData: (settings: LotSettings) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'settings';
  return onSnapshot(
    doc(db, path, 'current'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<LotSettings>;
        onData({
          ...DEFAULT_SETTINGS,
          ...data,
          multipliers: {
            ...DEFAULT_SETTINGS.multipliers,
            ...(data.multipliers || {}),
          },
        });
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, `${path}/current`);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

/**
 * Real-time Gate Activities Listener
 */
export function subscribeToGateActivities(
  onData: (activities: GateActivityItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'gate_activities';
  const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: GateActivityItem[] = [];
      snapshot.forEach((d) => {
        if (!DEMO_ACTIVITY_ID_SET.has(d.id)) {
          items.push({ ...(d.data() as GateActivityItem), id: d.id });
        }
      });
      items.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

/**
 * Sanitizes object by removing any undefined properties before writing to Firestore.
 * Firestore throws a runtime error if any property value is undefined.
 */
export function cleanData<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        cleaned[key] = cleanData(val);
      } else if (Array.isArray(val)) {
        cleaned[key] = val
          .filter((item) => item !== undefined)
          .map((item) => (typeof item === 'object' && item !== null ? cleanData(item) : item));
      } else {
        cleaned[key] = val;
      }
    }
  }
  return cleaned;
}

/**
 * Firestore Mutations with skill error handling
 */
export async function createVehicleInFirestore(vehicle: VehicleRecord): Promise<void> {
  const path = `vehicles/${vehicle.id}`;
  try {
    await setDoc(doc(db, 'vehicles', vehicle.id), cleanData(vehicle));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateVehicleInFirestore(vehicle: VehicleRecord): Promise<void> {
  const path = `vehicles/${vehicle.id}`;
  try {
    await setDoc(doc(db, 'vehicles', vehicle.id), cleanData(vehicle), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveSettingsInFirestore(settings: LotSettings): Promise<void> {
  const path = 'settings/current';
  try {
    await setDoc(doc(db, 'settings', 'current'), cleanData(settings));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createGateActivityInFirestore(item: GateActivityItem): Promise<void> {
  const path = `gate_activities/${item.id}`;
  try {
    await setDoc(doc(db, 'gate_activities', item.id), cleanData(item));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Real-time Operator Sessions Listener
 */
export function subscribeToOperatorSessions(
  onData: (sessions: OperatorSession[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'operator_sessions';
  const q = query(collection(db, path), orderBy('loginTime', 'desc'), limit(100));
  return onSnapshot(
    q,
    (snapshot) => {
      const sessions: OperatorSession[] = [];
      snapshot.forEach((d) => {
        if (!DEMO_SESSION_ID_SET.has(d.id)) {
          sessions.push({ ...(d.data() as OperatorSession), id: d.id });
        }
      });
      // Sort newest login first
      sessions.sort(
        (a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
      );
      onData(sessions);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function createOperatorSessionInFirestore(session: OperatorSession): Promise<void> {
  const path = `operator_sessions/${session.id}`;
  const safeSession: OperatorSession = {
    ...session,
    notes: session.notes ?? '',
    vehiclesProcessed: session.vehiclesProcessed ?? 0,
    durationMinutes: session.durationMinutes ?? 0,
    logoutTime: session.logoutTime ?? null,
  };
  try {
    await setDoc(doc(db, 'operator_sessions', session.id), cleanData(safeSession));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOperatorSessionInFirestore(session: OperatorSession): Promise<void> {
  const path = `operator_sessions/${session.id}`;
  const safeSession: OperatorSession = {
    ...session,
    notes: session.notes ?? '',
    vehiclesProcessed: session.vehiclesProcessed ?? 0,
    durationMinutes: session.durationMinutes ?? 0,
    logoutTime: session.logoutTime ?? null,
  };
  try {
    await setDoc(doc(db, 'operator_sessions', session.id), cleanData(safeSession), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Real-time Staff Users Listener
 */
export function subscribeToStaffUsers(
  onData: (staff: StaffUser[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'staff_users';
  const q = query(collection(db, path));
  return onSnapshot(
    q,
    (snapshot) => {
      const staffList: StaffUser[] = [];
      snapshot.forEach((d) => {
        if (!DEMO_STAFF_ID_SET.has(d.id)) {
          staffList.push({ ...(d.data() as StaffUser), id: d.id });
        }
      });
      onData(staffList);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function createStaffUserInFirestore(staff: StaffUser): Promise<void> {
  const path = `staff_users/${staff.id}`;
  try {
    await setDoc(doc(db, 'staff_users', staff.id), cleanData(staff));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteStaffUserInFirestore(staffId: string): Promise<void> {
  const path = `staff_users/${staffId}`;
  try {
    await deleteDoc(doc(db, 'staff_users', staffId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
