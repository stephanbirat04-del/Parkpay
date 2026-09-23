import { StaffUser } from '../types';
import { LayoutDashboard, Car, History, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  currentView: 'dashboard' | 'active' | 'history' | 'settings';
  setCurrentView: (view: 'dashboard' | 'active' | 'history' | 'settings') => void;
  currentUser: StaffUser;
  onSignOut: () => void;
}

export function Sidebar({
  currentView,
  setCurrentView,
  currentUser,
  onSignOut,
}: SidebarProps) {
  const navItems: { id: 'dashboard' | 'active' | 'history' | 'settings'; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'active', label: 'Active Lot', icon: Car },
    { id: 'history', label: 'History', icon: History },
    ...(currentUser.role === 'admin'
      ? [{ id: 'settings' as const, label: 'Settings', icon: Settings, adminOnly: true }]
      : []),
  ];

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col justify-between h-screen shrink-0 select-none">
      {/* Brand & Nav */}
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-base tracking-tight shadow-xs">
            P
          </div>
          <div>
            <h1 className="font-bold text-neutral-900 text-base leading-tight tracking-tight">ParkPay</h1>
            <p className="text-[11px] text-neutral-400 font-medium">Gate Operations</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-neutral-100/90 text-neutral-900 font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.adminOnly && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800 font-semibold">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Operator profile footer */}
      <div className="p-4 border-t border-neutral-100 bg-[#FAFBF9]">
        <div className="flex items-center gap-1.5 mb-2 text-[11px] font-medium text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System live</span>
        </div>

        <div className="mb-3">
          <div className="text-sm font-semibold text-neutral-900 leading-snug">{currentUser.name}</div>
          <div className="text-xs text-neutral-500 mt-0.5">
            <span>{currentUser.title}</span>
          </div>
        </div>

        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-red-700 hover:bg-red-50/80 rounded-md border border-neutral-200 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
