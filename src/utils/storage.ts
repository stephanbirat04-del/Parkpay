import { LotSettings, StaffUser, VehicleRecord, GateActivityItem, OperatorSession } from '../types';
import { INITIAL_SETTINGS, INITIAL_STAFF, INITIAL_VEHICLES, INITIAL_GATE_ACTIVITY, INITIAL_OPERATOR_SESSIONS } from './initialData';

const SETTINGS_KEY = 'parkpay_settings_v1';
const VEHICLES_KEY = 'parkpay_vehicles_v1';
const CURRENT_USER_KEY = 'parkpay_current_user_v1';
const CURRENT_SESSION_KEY = 'parkpay_current_session_v1';
const GATE_ACTIVITY_KEY = 'parkpay_gate_activity_v1';
const OPERATOR_SESSIONS_KEY = 'parkpay_operator_sessions_v1';

export function loadSettings(): LotSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_SETTINGS;
}

export function saveSettings(settings: LotSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

export function loadVehicles(): VehicleRecord[] {
  try {
    const raw = localStorage.getItem(VEHICLES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_VEHICLES;
}

export function saveVehicles(vehicles: VehicleRecord[]): void {
  try {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
  } catch (e) {
    console.error(e);
  }
}

export function loadCurrentUser(): StaffUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  // Start on the Login page by default so the user can experience the login flow
  return null;
}

export function saveCurrentUser(user: StaffUser | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error(e);
  }
}

export function loadGateActivity(): GateActivityItem[] {
  try {
    const raw = localStorage.getItem(GATE_ACTIVITY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_GATE_ACTIVITY;
}

export function saveGateActivity(activity: GateActivityItem[]): void {
  try {
    localStorage.setItem(GATE_ACTIVITY_KEY, JSON.stringify(activity));
  } catch (e) {
    console.error(e);
  }
}

export function loadOperatorSessions(): OperatorSession[] {
  try {
    const raw = localStorage.getItem(OPERATOR_SESSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_OPERATOR_SESSIONS;
}

export function saveOperatorSessions(sessions: OperatorSession[]): void {
  try {
    localStorage.setItem(OPERATOR_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error(e);
  }
}

export function loadCurrentSession(): OperatorSession | null {
  try {
    const raw = localStorage.getItem(CURRENT_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return null;
}

export function saveCurrentSession(session: OperatorSession | null): void {
  try {
    if (session) {
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
  } catch (e) {
    console.error(e);
  }
}

export function exportOperatorSessionsToCSV(sessions: OperatorSession[]): void {
  const headers = [
    'Session ID',
    'Operator Name',
    'Operator Email',
    'Role',
    'Gate',
    'Login Time (ISO)',
    'Logout Time (ISO)',
    'Shift Duration (min)',
    'Status',
    'Vehicles Processed',
    'Notes'
  ];

  const rows = sessions.map(s => [
    `"${s.id}"`,
    `"${s.operatorName}"`,
    `"${s.operatorEmail}"`,
    `"${s.operatorRole}"`,
    `"${s.gate}"`,
    `"${s.loginTime}"`,
    `"${s.logoutTime || 'Currently Active'}"`,
    `"${s.durationMinutes ?? ''}"`,
    `"${s.status}"`,
    `"${s.vehiclesProcessed ?? 0}"`,
    `"${s.notes || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const todayStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `parkpay_operator_shifts_${todayStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportVehiclesToCSV(vehicles: VehicleRecord[]): void {
  const headers = [
    'License Plate',
    'Vehicle Type',
    'Owner Phone',
    'Entry Time',
    'Exit Time',
    'Duration (min)',
    'Fee (INR)',
    'Status',
    'Payment Status',
    'Payment Method',
    'Receipt Number',
    'Logged By Staff'
  ];

  const rows = vehicles.map(v => [
    `"${v.plateNumber}"`,
    `"${v.vehicleType}"`,
    `"${v.ownerPhone || 'N/A'}"`,
    `"${v.entryTime}"`,
    `"${v.exitTime || 'N/A'}"`,
    `"${v.durationMinutes || ''}"`,
    `"${v.fee}"`,
    `"${v.status}"`,
    `"${v.paymentStatus}"`,
    `"${v.paymentMethod || 'N/A'}"`,
    `"${v.receiptNumber || 'N/A'}"`,
    `"${v.loggedBy}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const todayStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `parkpay_records_${todayStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
