import { useState } from 'react';
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

import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ExitModal } from './components/ExitModal';
import { ReceiptModal } from './components/ReceiptModal';

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
  
  // Recent exit banner vehicle (matching screenshot 3)
  const [recentExitVehicle, setRecentExitVehicle] = useState<VehicleRecord | null>(() => {
    const exited = loadVehicles().filter((v) => v.status === 'Exited');
    return exited.length > 0 ? exited[0] : null;
  });

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
  const handleLogEntry = (plate: string, phone: string, type: VehicleType) => {
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
  };

  const handleProcessExit = (vehicle: VehicleRecord) => {
    setVehicleToExit(vehicle);
  };

  const handleConfirmExit = (
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
  };

  const handleMarkPaid = (vehicleId: string) => {
    const updatedVehicles = vehicles.map((v) =>
      v.id === vehicleId ? { ...v, paymentStatus: 'Paid' as const, paymentMethod: 'Cash' as const } : v
    );
    setVehicles(updatedVehicles);
    saveVehicles(updatedVehicles);
  };

  const handleSaveSettings = (newSettings: LotSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
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
        <TopBar currentView={currentView} />

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
        />
      )}
    </div>
  );
}
