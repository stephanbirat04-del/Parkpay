import { useState, useEffect } from 'react';
import {
  VehicleRecord,
  VehicleType,
  PaymentMethod,
  PaymentStatus,
  StaffUser,
  LotSettings,
  GateActivityItem,
  OperatorSession,
} from './types';
import {
  loadCurrentUser,
  saveCurrentUser,
  loadSettings,
  saveSettings,
  loadVehicles,
  saveVehicles,
  loadGateActivity,
  saveGateActivity,
  loadOperatorSessions,
  saveOperatorSessions,
  loadCurrentSession,
  saveCurrentSession,
  loadStaffUsers,
  saveStaffUsers,
} from './utils/storage';
import { INITIAL_STAFF } from './utils/initialData';
import { calculateFee, generateReceiptNumber, formatTimeIST } from './utils/fee';
import {
  seedFirestoreIfEmpty,
  subscribeToVehicles,
  subscribeToSettings,
  subscribeToGateActivities,
  subscribeToOperatorSessions,
  subscribeToStaffUsers,
  createVehicleInFirestore,
  updateVehicleInFirestore,
  saveSettingsInFirestore,
  createGateActivityInFirestore,
  createOperatorSessionInFirestore,
  updateOperatorSessionInFirestore,
  createStaffUserInFirestore,
  deleteStaffUserInFirestore,
} from './firebase';

import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ExitModal } from './components/ExitModal';
import { ReceiptModal } from './components/ReceiptModal';
import { GmailEmailModal } from './components/GmailEmailModal';
import { ShiftSummaryModal } from './components/ShiftSummaryModal';
import { signInWithGoogle, getAccessToken } from './services/gmail';
import { auth } from './firebase';

import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { ActiveLotView } from './views/ActiveLotView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => loadCurrentUser());
  const [staffList, setStaffList] = useState<StaffUser[]>(() => loadStaffUsers());
  const [operatorSessions, setOperatorSessions] = useState<OperatorSession[]>(() => {
    const loaded = loadOperatorSessions();
    return Array.isArray(loaded) ? loaded : [];
  });
  const [currentSession, setCurrentSession] = useState<OperatorSession | null>(() =>
    loadCurrentSession()
  );
  const [shiftModalMode, setShiftModalMode] = useState<'end-shift' | 'view' | null>(null);
  const [lastSession, setLastSession] = useState<OperatorSession | null>(() => {
    const sessions = loadOperatorSessions();
    return Array.isArray(sessions) ? (sessions.find((s) => s.status === 'completed') || null) : null;
  });

  // Navigation view
  const [currentView, setCurrentView] = useState<'dashboard' | 'active' | 'history' | 'settings'>('dashboard');

  // App data state
  const [settings, setSettings] = useState<LotSettings>(() => loadSettings());
  const [vehicles, setVehicles] = useState<VehicleRecord[]>(() => loadVehicles());
  const [gateActivity, setGateActivity] = useState<GateActivityItem[]>(() => loadGateActivity());

  // Modals state
  const [vehicleToExit, setVehicleToExit] = useState<VehicleRecord | null>(null);
  const [receiptVehicle, setReceiptVehicle] = useState<VehicleRecord | null>(null);
  const [emailVehicle, setEmailVehicle] = useState<VehicleRecord | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string | null>(() => auth.currentUser?.email || null);
  
  // Recent exit banner vehicle (matching screenshot 3)
  const [recentExitVehicle, setRecentExitVehicle] = useState<VehicleRecord | null>(() => {
    const exited = loadVehicles().filter((v) => v.status === 'Exited');
    return exited.length > 0 ? exited[0] : null;
  });

  // Check Google auth state on mount
  useEffect(() => {
    getAccessToken().then((token) => {
      if (token && auth.currentUser) {
        setGoogleEmail(auth.currentUser.email);
      }
    });
  }, []);

  const handleConnectGoogle = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.user) {
        setGoogleEmail(result.user.email);
      }
    } catch (err: any) {
      const isCancelled =
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        String(err?.message || '').includes('popup-closed-by-user') ||
        String(err?.message || '').includes('cancelled-popup-request');

      if (!isCancelled) {
        console.warn('Failed to connect Google account:', err);
      }
    }
  };

  // Sync with Firestore in real-time
  useEffect(() => {
    // Seed initial data if Firestore is empty
    seedFirestoreIfEmpty();

    // Subscribe to Firestore collections
    const unsubVehicles = subscribeToVehicles((firestoreVehicles) => {
      if (firestoreVehicles.length > 0) {
        setVehicles(firestoreVehicles);
        saveVehicles(firestoreVehicles);
        const latestExit = firestoreVehicles.find((v) => v.status === 'Exited');
        if (latestExit) setRecentExitVehicle(latestExit);
      }
    });

    const unsubSettings = subscribeToSettings((firestoreSettings) => {
      setSettings(firestoreSettings);
      saveSettings(firestoreSettings);
    });

    const unsubActivity = subscribeToGateActivities((firestoreActivity) => {
      if (firestoreActivity.length > 0) {
        setGateActivity(firestoreActivity);
        saveGateActivity(firestoreActivity);
      }
    });

    const unsubSessions = subscribeToOperatorSessions((firestoreSessions) => {
      if (Array.isArray(firestoreSessions) && firestoreSessions.length > 0) {
        setOperatorSessions(firestoreSessions);
        saveOperatorSessions(firestoreSessions);
      }
    });

    const unsubStaff = subscribeToStaffUsers((firestoreStaff) => {
      if (Array.isArray(firestoreStaff) && firestoreStaff.length > 0) {
        setStaffList(firestoreStaff);
        saveStaffUsers(firestoreStaff);
      }
    });

    return () => {
      unsubVehicles();
      unsubSettings();
      unsubActivity();
      unsubSessions();
      unsubStaff();
    };
  }, []);

  // Auth handlers
  const handleLogin = (
    user: StaffUser,
    preferredView?: 'dashboard' | 'active' | 'history' | 'settings'
  ) => {
    setCurrentUser(user);
    saveCurrentUser(user);

    if (preferredView) {
      setCurrentView(preferredView);
    } else if (user.role === 'admin') {
      setCurrentView('dashboard');
    }

    // Only employees (staff operators) register shifts; admins do not log shifts
    if (user.role === 'admin') {
      setCurrentSession(null);
      saveCurrentSession(null);
      return;
    }

    const nowIso = new Date().toISOString();
    const sessionsList = Array.isArray(operatorSessions) ? operatorSessions : [];
    const existingActive = sessionsList.find(
      (s) => s.operatorId === user.id && s.status === 'active'
    );

    const session: OperatorSession = existingActive || {
      id: `sess-${Date.now()}`,
      operatorId: user.id,
      operatorName: user.name,
      operatorEmail: user.email,
      operatorRole: user.role,
      gate: user.gate || 'Gate 1',
      loginTime: nowIso,
      logoutTime: null,
      durationMinutes: 0,
      status: 'active',
      vehiclesProcessed: 0,
      notes: '',
    };

    setCurrentSession(session);
    saveCurrentSession(session);

    if (!existingActive) {
      const updated = [session, ...sessionsList];
      setOperatorSessions(updated);
      saveOperatorSessions(updated);
      createOperatorSessionInFirestore(session).catch((e) =>
        console.warn('Failed to sync operator session on login:', e)
      );
    } else {
      createOperatorSessionInFirestore(existingActive).catch((e) =>
        console.warn('Failed to ensure active session in Firestore:', e)
      );
    }
  };

  const handleSignOut = () => {
    if (currentUser?.role === 'admin') {
      // Admin signs out directly without shift timing recording
      setCurrentSession(null);
      saveCurrentSession(null);
      setCurrentUser(null);
      saveCurrentUser(null);
      return;
    }
    // For employee/staff, open the Shift Summary & Logout modal to verify shift timings
    setShiftModalMode('end-shift');
  };

  const handleConfirmSignOut = async (notes?: string) => {
    // If admin, no shift to record
    if (currentUser?.role === 'admin') {
      setCurrentSession(null);
      saveCurrentSession(null);
      setCurrentUser(null);
      saveCurrentUser(null);
      setShiftModalMode(null);
      return;
    }

    const logoutTimeIso = new Date().toISOString();
    const loginTimeIso = currentSession?.loginTime || logoutTimeIso;
    const diffMs = Math.max(0, new Date(logoutTimeIso).getTime() - new Date(loginTimeIso).getTime());
    const durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

    const completedSession: OperatorSession = {
      ...(currentSession || {
        id: `sess-${Date.now()}`,
        operatorId: currentUser?.id || 'staff-1',
        operatorName: currentUser?.name || 'Gate Operator',
        operatorEmail: currentUser?.email || 'operator@parkpay.in',
        operatorRole: 'staff',
        gate: currentUser?.gate || 'Gate 1',
        loginTime: loginTimeIso,
        vehiclesProcessed: 0,
      }),
      logoutTime: logoutTimeIso,
      durationMinutes,
      status: 'completed',
      notes: notes || currentSession?.notes || '',
    };

    const sessionsList = Array.isArray(operatorSessions) ? operatorSessions : [];
    const updatedSessions = sessionsList.map((s) =>
      s.id === completedSession.id ? completedSession : s
    );
    if (!updatedSessions.some((s) => s.id === completedSession.id)) {
      updatedSessions.unshift(completedSession);
    }

    setOperatorSessions(updatedSessions);
    saveOperatorSessions(updatedSessions);

    try {
      await updateOperatorSessionInFirestore(completedSession);
    } catch (e) {
      console.warn('Failed to sync operator session logout to Firestore:', e);
    }

    setLastSession(completedSession);
    setCurrentSession(null);
    saveCurrentSession(null);
    setCurrentUser(null);
    saveCurrentUser(null);
    setShiftModalMode(null);
  };

  // Data operations
  const handleLogEntry = async (plate: string, phone: string, type: VehicleType) => {
    const nowIso = new Date().toISOString();
    const newRecord: VehicleRecord = {
      id: `v-${Date.now()}`,
      plateNumber: plate.toUpperCase(),
      vehicleType: type,
      ownerPhone: phone || undefined,
      entryTime: nowIso,
      fee: 0,
      status: 'Parked',
      paymentStatus: 'Unpaid',
      loggedBy: currentUser ? currentUser.name : 'Ananya Sharma',
      rateAppliedAtEntry: settings.hourlyRate,
      graceMinutesAtEntry: settings.gracePeriodMinutes,
      minimumChargeAtEntry: settings.minimumCharge,
    };

    const updatedVehicles = [newRecord, ...vehicles];
    setVehicles(updatedVehicles);
    saveVehicles(updatedVehicles);

    // Add to activity stream
    const newActivity: GateActivityItem = {
      id: `act-${Date.now()}`,
      timestamp: nowIso,
      timeFormatted: formatTimeIST(nowIso),
      plateNumber: plate.toUpperCase(),
      action: 'entered',
      vehicleType: type,
    };
    const updatedActivity = [newActivity, ...gateActivity];
    setGateActivity(updatedActivity);
    saveGateActivity(updatedActivity);

    // Persist to Cloud Firestore
    try {
      await createVehicleInFirestore(newRecord);
      await createGateActivityInFirestore(newActivity);
    } catch (e) {
      console.error('Failed to sync entry to Firestore:', e);
    }

    // Update active operator shift vehicles processed count
    if (currentSession) {
      const updatedSess: OperatorSession = {
        ...currentSession,
        vehiclesProcessed: (currentSession.vehiclesProcessed || 0) + 1,
      };
      setCurrentSession(updatedSess);
      saveCurrentSession(updatedSess);
      setOperatorSessions((prev) =>
        prev.map((s) => (s.id === updatedSess.id ? updatedSess : s))
      );
      updateOperatorSessionInFirestore(updatedSess).catch(() => {});
    }
  };

  const handleProcessExit = (vehicle: VehicleRecord) => {
    setVehicleToExit(vehicle);
  };

  const handleConfirmExit = async (
    vehicle: VehicleRecord,
    paymentMethod: PaymentMethod,
    paymentStatus: PaymentStatus,
    openReceipt: boolean
  ) => {
    const exitTimeIso = new Date().toISOString();
    const feeResult = calculateFee(vehicle.entryTime, exitTimeIso, {
      hourlyRate: vehicle.rateAppliedAtEntry || settings.hourlyRate,
      minimumCharge: vehicle.minimumChargeAtEntry || settings.minimumCharge,
      gracePeriodMinutes: vehicle.graceMinutesAtEntry || settings.gracePeriodMinutes,
      vehicleType: vehicle.vehicleType,
      multipliers: settings.multipliers,
    });

    const receiptNum = vehicle.receiptNumber || generateReceiptNumber();

    const updatedVehicle: VehicleRecord = {
      ...vehicle,
      exitTime: exitTimeIso,
      durationMinutes: feeResult.durationMinutes,
      fee: feeResult.finalFee,
      status: 'Exited',
      paymentStatus,
      paymentMethod,
      receiptNumber: receiptNum,
      loggedBy: currentUser ? currentUser.name : vehicle.loggedBy,
    };

    const updatedVehicles = vehicles.map((v) => (v.id === vehicle.id ? updatedVehicle : v));
    setVehicles(updatedVehicles);
    saveVehicles(updatedVehicles);

    // Update recent exit banner
    setRecentExitVehicle(updatedVehicle);

    // Add exit activity
    const newActivity: GateActivityItem = {
      id: `act-${Date.now()}`,
      timestamp: exitTimeIso,
      timeFormatted: formatTimeIST(exitTimeIso),
      plateNumber: vehicle.plateNumber,
      action: 'exited',
      vehicleType: vehicle.vehicleType,
      fee: feeResult.finalFee,
    };
    const updatedActivity = [newActivity, ...gateActivity];
    setGateActivity(updatedActivity);
    saveGateActivity(updatedActivity);

    setVehicleToExit(null);

    if (openReceipt) {
      setReceiptVehicle(updatedVehicle);
    }

    // Persist to Cloud Firestore
    try {
      await updateVehicleInFirestore(updatedVehicle);
      await createGateActivityInFirestore(newActivity);
    } catch (e) {
      console.error('Failed to sync exit to Firestore:', e);
    }

    // Update active operator shift vehicles processed count
    if (currentSession) {
      const updatedSess: OperatorSession = {
        ...currentSession,
        vehiclesProcessed: (currentSession.vehiclesProcessed || 0) + 1,
      };
      setCurrentSession(updatedSess);
      saveCurrentSession(updatedSess);
      setOperatorSessions((prev) =>
        prev.map((s) => (s.id === updatedSess.id ? updatedSess : s))
      );
      updateOperatorSessionInFirestore(updatedSess).catch(() => {});
    }
  };

  const handleMarkPaid = async (vehicleId: string) => {
    const target = vehicles.find((v) => v.id === vehicleId);
    const updatedVehicles = vehicles.map((v) =>
      v.id === vehicleId ? { ...v, paymentStatus: 'Paid' as const, paymentMethod: 'Cash' as const } : v
    );
    setVehicles(updatedVehicles);
    saveVehicles(updatedVehicles);

    if (target) {
      try {
        await updateVehicleInFirestore({
          ...target,
          paymentStatus: 'Paid',
          paymentMethod: 'Cash',
        });
      } catch (e) {
        console.error('Failed to sync paid status to Firestore:', e);
      }
    }
  };

  const handleSaveSettings = async (newSettings: LotSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    try {
      await saveSettingsInFirestore(newSettings);
    } catch (e) {
      console.error('Failed to sync settings to Firestore:', e);
    }
  };

  // Staff management handlers
  const handleRegisterStaff = async (newStaff: StaffUser) => {
    const updated = [...staffList.filter((s) => s.id !== newStaff.id), newStaff];
    setStaffList(updated);
    saveStaffUsers(updated);
    try {
      await createStaffUserInFirestore(newStaff);
    } catch (e) {
      console.warn('Failed to sync staff user to Firestore:', e);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    const updated = staffList.filter((s) => s.id !== staffId);
    setStaffList(updated);
    saveStaffUsers(updated);
    try {
      await deleteStaffUserInFirestore(staffId);
    } catch (e) {
      console.warn('Failed to delete staff user from Firestore:', e);
    }
  };

  // If unauthenticated, show Staff sign-in view matching Screen 1
  if (!currentUser) {
    return (
      <LoginView
        onLogin={handleLogin}
        onRegisterStaff={handleRegisterStaff}
        staffList={staffList}
        lastSession={lastSession}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9F7] text-neutral-900">
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        currentSession={currentSession}
        onSignOut={handleSignOut}
        onOpenShiftDetails={() => setShiftModalMode('view')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top bar with Breadcrumbs and Live Synced Timestamp */}
        <TopBar
          currentView={currentView}
          googleEmail={googleEmail}
          onConnectGoogle={handleConnectGoogle}
          currentUser={currentUser}
          currentSession={currentSession}
          onOpenShiftDetails={() => setShiftModalMode('view')}
        />

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {currentView === 'dashboard' && (
            <DashboardView
              vehicles={vehicles}
              gateActivity={gateActivity}
              currentUser={currentUser}
              onNavigateToActive={() => setCurrentView('active')}
            />
          )}

          {currentView === 'active' && (
            <ActiveLotView
              vehicles={vehicles}
              settings={settings}
              currentUser={currentUser}
              currentSession={currentSession}
              onLogEntry={handleLogEntry}
              onProcessExit={handleProcessExit}
              onReprintReceipt={(v) => setReceiptVehicle(v)}
              recentExitVehicle={recentExitVehicle}
            />
          )}

          {currentView === 'history' && (
            <HistoryView
              vehicles={vehicles}
              operatorSessions={operatorSessions}
              currentSession={currentSession}
              onPrintReceipt={(v) => setReceiptVehicle(v)}
              onMarkPaid={handleMarkPaid}
              onEmailReceipt={(v) => setEmailVehicle(v)}
            />
          )}

          {currentView === 'settings' && currentUser.role === 'admin' && (
            <SettingsView
              settings={settings}
              currentUser={currentUser}
              staffList={staffList}
              onSaveSettings={handleSaveSettings}
              onRegisterStaff={handleRegisterStaff}
              onDeleteStaff={handleDeleteStaff}
            />
          )}

          {currentView === 'settings' && currentUser.role !== 'admin' && (
            <DashboardView
              vehicles={vehicles}
              gateActivity={gateActivity}
              onNavigateToActive={() => setCurrentView('active')}
            />
          )}
        </main>
      </div>

      {/* Exit Checkout Modal */}
      {vehicleToExit && (
        <ExitModal
          vehicle={vehicleToExit}
          settings={settings}
          onConfirm={handleConfirmExit}
          onClose={() => setVehicleToExit(null)}
        />
      )}

      {/* Thermal Receipt Print & Download Modal */}
      {receiptVehicle && (
        <ReceiptModal
          vehicle={receiptVehicle}
          settings={settings}
          onClose={() => setReceiptVehicle(null)}
          onEmailReceipt={(v) => {
            setEmailVehicle(v);
          }}
        />
      )}

      {/* Gmail Digital Receipt Modal with Confirmation Flow */}
      <GmailEmailModal
        vehicle={emailVehicle}
        lotSettings={settings}
        isOpen={Boolean(emailVehicle)}
        onClose={() => setEmailVehicle(null)}
        senderName={currentUser?.name || 'Gate Operator'}
      />

      {/* Operator Shift Timings & Log Out Modal */}
      {shiftModalMode && (
        <ShiftSummaryModal
          isOpen={Boolean(shiftModalMode)}
          onClose={() => setShiftModalMode(null)}
          currentUser={currentUser}
          currentSession={currentSession}
          onConfirmSignOut={handleConfirmSignOut}
          mode={shiftModalMode}
        />
      )}
    </div>
  );
}
