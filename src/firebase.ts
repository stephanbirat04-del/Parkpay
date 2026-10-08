import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { VehicleRecord, LotSettings, GateActivityItem, OperatorSession } from './types';
import { INITIAL_VEHICLES, INITIAL_GATE_ACTIVITY, INITIAL_SETTINGS, INITIAL_OPERATOR_SESSIONS } from './utils/initialData';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with databaseId as required by Skill
export const FIRESTORE_DATABASE_ID =
  (firebaseConfig as Record<string, any>).firestoreDatabaseId ||
  'ai-studio-parkpayparkinglo-86efe5aa-1da6-42a2-acc9-5581887002d9';

export const db = getFirestore(app, FIRESTORE_DATABASE_ID);
export const auth = getAuth(app);

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
 * Seed initial parking data if Firestore collections are empty
 */
export async function seedFirestoreIfEmpty(): Promise<void> {
  try {
    // Seed vehicles if empty
    const vehiclesSnap = await getDocs(collection(db, 'vehicles'));
    if (vehiclesSnap.empty) {
      for (const v of INITIAL_VEHICLES) {
        await setDoc(doc(db, 'vehicles', v.id), v);
      }
    }

    // Seed settings if empty
    const settingsSnap = await getDocs(collection(db, 'settings'));
    if (settingsSnap.empty) {
      await setDoc(doc(db, 'settings', 'current'), INITIAL_SETTINGS);
    }

    // Seed gate activities if empty
    const gateSnap = await getDocs(collection(db, 'gate_activities'));
    if (gateSnap.empty) {
      for (const a of INITIAL_GATE_ACTIVITY) {
        await setDoc(doc(db, 'gate_activities', a.id), a);
      }
    }

    // Seed operator shifts / sessions if empty
    const sessionsSnap = await getDocs(collection(db, 'operator_sessions'));
    if (sessionsSnap.empty) {
      for (const s of INITIAL_OPERATOR_SESSIONS) {
        await setDoc(doc(db, 'operator_sessions', s.id), s);
      }
    }
  } catch (error) {
    console.warn('Initial seeding fallback check:', error);
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
        records.push({ ...(d.data() as VehicleRecord), id: d.id });
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
        onData(snap.data() as LotSettings);
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
  const q = query(collection(db, path), limit(30));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: GateActivityItem[] = [];
      snapshot.forEach((d) => {
        items.push({ ...(d.data() as GateActivityItem), id: d.id });
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
 * Firestore Mutations with skill error handling
 */
export async function createVehicleInFirestore(vehicle: VehicleRecord): Promise<void> {
  const path = `vehicles/${vehicle.id}`;
  try {
    await setDoc(doc(db, 'vehicles', vehicle.id), vehicle);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateVehicleInFirestore(vehicle: VehicleRecord): Promise<void> {
  const path = `vehicles/${vehicle.id}`;
  try {
    await setDoc(doc(db, 'vehicles', vehicle.id), { ...vehicle }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveSettingsInFirestore(settings: LotSettings): Promise<void> {
  const path = 'settings/current';
  try {
    await setDoc(doc(db, 'settings', 'current'), settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createGateActivityInFirestore(item: GateActivityItem): Promise<void> {
  const path = `gate_activities/${item.id}`;
  try {
    await setDoc(doc(db, 'gate_activities', item.id), item);
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
  const q = query(collection(db, path), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const sessions: OperatorSession[] = [];
      snapshot.forEach((d) => {
        sessions.push({ ...(d.data() as OperatorSession), id: d.id });
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
  try {
    await setDoc(doc(db, 'operator_sessions', session.id), session);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOperatorSessionInFirestore(session: OperatorSession): Promise<void> {
  const path = `operator_sessions/${session.id}`;
  try {
    await setDoc(doc(db, 'operator_sessions', session.id), { ...session }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
