import { useState, useEffect } from 'react';

interface TopBarProps {
  currentView: string;
}

export function TopBar({ currentView }: TopBarProps) {
  const [timeStr, setTimeStr] = useState('23 SEP 2026 · 13:42 IST');
  const [useRealTime, setUseRealTime] = useState(false);

  useEffect(() => {
    if (!useRealTime) {
      setTimeStr('23 SEP 2026 · 13:42 IST');
      return;
    }

    const updateClock = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${day} ${month} ${year} · ${hours}:${minutes} IST`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [useRealTime]);

  const viewLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    active: 'Active Lot',
    history: 'History',
    settings: 'Settings',
  };

  return (
    <header className="h-12 border-b border-neutral-200/80 bg-[#FAFBF9] px-6 flex items-center justify-between text-xs text-neutral-500 shrink-0 select-none">
      <div className="flex items-center gap-2 font-medium tracking-tight">
        <span className="text-neutral-700">ParkPay</span>
        <span className="text-neutral-300">/</span>
        <span className="text-neutral-500">Day Shift</span>
        <span className="text-neutral-300">/</span>
        <span className="text-emerald-800 font-semibold">{viewLabels[currentView] || 'Active'}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-neutral-600 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span>Live · synced</span>
        </div>

        <span className="text-neutral-300 font-light">|</span>

        <button
          onClick={() => setUseRealTime(!useRealTime)}
          title="Click to toggle between simulated IST timestamp and live clock"
          className="font-mono text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer tabular-nums flex items-center gap-1 text-[11px]"
        >
          {timeStr}
        </button>
      </div>
    </header>
  );
}
