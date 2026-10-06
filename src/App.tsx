import { useState, useEffect } from 'react';
import {
  VehicleRecord,
  VehicleType,
  PaymentMethod,
  PaymentStatus,
  StaffUser,
  LotSettings,
  GateActivityItem,
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
} from './utils/storage';
import { INITIAL_STAFF } from './utils/initialData';
import { calculateFee, generateReceiptNumber, formatTimeIST } from './utils/fee';
import {
  seedFirestoreIfEmpty,
  subscribeToVehicles,
  subscribeToSettings,
  subscribeToGateActivities,
  createVehicleInFirestore,
  updateVehicleInFirestore,
  saveSettingsInFirestore,
  createGateActivityInFirestore,
} from './firebase';

import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ExitModal } from './components/ExitModal';
import { ReceiptModal } from './components/ReceiptModal';
import { GmailEmailModal } from './components/GmailEmailModal';
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
    } catch (err) {
      console.error('Failed to connect Google account:', err);
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

    return () => {
      unsubVehicles();
      unsubSettings();
      unsubActivity();
    };
  }, []);

  // Auth handlers
  const handleLogin = (user: StaffUser) => {
    setCurrentUser(user);
    saveCurrentUser(user);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    saveCurrentUser(null);
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

  // If unauthenticated, show Staff sign-in view matching Screen 1
  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9F7] text-neutral-900">
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top bar with Breadcrumbs and Live Synced Timestamp */}
        <TopBar
          currentView={currentView}
          googleEmail={googleEmail}
          onConnectGoogle={handleConnectGoogle}
        />

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {currentView === 'dashboard' && (
            <DashboardView
              vehicles={vehicles}
              gateActivity={gateActivity}
              onNavigateToActive={() => setCurrentView('active')}
            />
          )}

          {currentView === 'active' && (
            <ActiveLotView
              vehicles={vehicles}
              settings={settings}
              currentUser={currentUser}
              onLogEntry={handleLogEntry}
              onProcessExit={handleProcessExit}
              onReprintReceipt={(v) => setReceiptVehicle(v)}
              recentExitVehicle={recentExitVehicle}
            />
          )}

          {currentView === 'history' && (
            <HistoryView
              vehicles={vehicles}
              onPrintReceipt={(v) => setReceiptVehicle(v)}
              onMarkPaid={handleMarkPaid}
              onEmailReceipt={(v) => setEmailVehicle(v)}
            />
          )}

          {currentView === 'settings' && currentUser.role === 'admin' && (
            <SettingsView
              settings={settings}
              currentUser={currentUser}
              onSaveSettings={handleSaveSettings}
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
    </div>
  );
}
