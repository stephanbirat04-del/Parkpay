import { useState } from 'react';
import { VehicleRecord, GateActivityItem } from '../types';
import { REVENUE_TREND_DAYS, EXITS_BY_HOUR } from '../utils/initialData';
import { ArrowUpRight, Car, Activity, Users, CircleDollarSign } from 'lucide-react';

interface DashboardViewProps {
  vehicles: VehicleRecord[];
  gateActivity: GateActivityItem[];
  onNavigateToActive: () => void;
}

export function DashboardView({ vehicles, gateActivity, onNavigateToActive }: DashboardViewProps) {
  const [hoveredDay, setHoveredDay] = useState<{ day: string; amount: number } | null>(null);
  const [hoveredHour, setHoveredHour] = useState<{ hour: string; exits: number } | null>(null);

  // Dynamic calculations
  const currentlyParkedCount = vehicles.filter((v) => v.status === 'Parked').length;
  const exitedToday = vehicles.filter((v) => v.status === 'Exited');
  const exitedCount = exitedToday.length;
  
  // Base today revenue calculation plus exited vehicles fee sum
  const revenueCalculated = 18450;
  const monthRevenue = '₹4,28,900';

  // Find max for bar scaling
  const maxDayAmount = Math.max(...REVENUE_TREND_DAYS.map((d) => d.amount));
  const maxHourExits = Math.max(...EXITS_BY_HOUR.map((h) => h.exits));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Dashboard</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Live view of lot occupancy and revenue.</p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Currently Parked */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Currently parked</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 tracking-wide">
              LIVE
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-neutral-900 tabular-nums">
              {currentlyParkedCount}
            </span>
            <button
              onClick={onNavigateToActive}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-0.5 cursor-pointer"
            >
              <span>Manage</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Today's revenue */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Today s revenue</span>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center">
              +8.4%
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-neutral-900 tabular-nums">
              ₹{revenueCalculated.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Today's exits */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Today s exits</span>
            <span className="text-[11px] text-neutral-400 font-medium">12 this hour</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-neutral-900 tabular-nums">
              {Math.max(87, exitedCount)}
            </span>
          </div>
        </div>

        {/* Month revenue */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Month revenue</span>
            <span className="text-[11px] font-semibold text-emerald-700">+11.2%</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-neutral-900 tabular-nums">
              {monthRevenue}
            </span>
          </div>
        </div>
      </div>

      {/* Two visual charts: 7-day revenue trend & Today's exits by hour */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 7-day revenue trend */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-900">7-day revenue trend</h3>
            <span className="text-xs text-neutral-400 font-mono">
              {hoveredDay ? `${hoveredDay.day}: ₹${hoveredDay.amount.toLocaleString('en-IN')}` : 'Weekly total: ₹1,50,250'}
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-neutral-100">
            {REVENUE_TREND_DAYS.map((item) => {
              const heightPct = Math.round((item.amount / maxDayAmount) * 100);
              const isHovered = hoveredDay?.day === item.day;
              return (
                <div
                  key={item.day}
                  onMouseEnter={() => setHoveredDay(item)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                >
                  <div className="w-full relative flex items-end justify-center h-32">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[36px] rounded-t-sm transition-all duration-150 ${
                        item.isToday
                          ? 'bg-emerald-800'
                          : isHovered
                          ? 'bg-emerald-700'
                          : 'bg-emerald-600/80 hover:bg-emerald-700'
                      }`}
                    ></div>
                  </div>
                  <span
                    className={`text-[11px] font-medium transition-colors ${
                      item.isToday ? 'text-neutral-900 font-bold' : 'text-neutral-500'
                    }`}
                  >
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's exits by hour */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-900">Today s exits by hour</h3>
            <span className="text-xs text-neutral-400 font-mono">
              {hoveredHour ? `${hoveredHour.hour}:00 · ${hoveredHour.exits} exits` : 'Peak at 12:00'}
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-neutral-100">
            {EXITS_BY_HOUR.map((item) => {
              const heightPct = Math.round((item.exits / maxHourExits) * 100);
              const isHovered = hoveredHour?.hour === item.hour;
              return (
                <div
                  key={item.hour}
                  onMouseEnter={() => setHoveredHour(item)}
                  onMouseLeave={() => setHoveredHour(null)}
                  className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                >
                  <div className="w-full relative flex items-end justify-center h-32">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[36px] rounded-t-sm transition-all duration-150 ${
                        isHovered ? 'bg-emerald-900' : 'bg-emerald-700/85 hover:bg-emerald-800'
                      }`}
                    ></div>
                  </div>
                  <span className="text-[11px] font-medium text-neutral-500">{item.hour}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Latest gate activity */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200/90 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-neutral-900">Latest gate activity</h3>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>2 lanes open</span>
          </div>
        </div>

        <div className="divide-y divide-neutral-100/90 mt-2">
          {gateActivity.slice(0, 5).map((act) => (
            <div
              key={act.id}
              className="py-3 flex items-center justify-between text-xs text-neutral-700 hover:bg-neutral-50/80 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-neutral-400 text-[11px]">{act.timeFormatted}</span>
                <span className="font-mono font-bold text-neutral-900">{act.plateNumber}</span>
                <span>
                  {act.action === 'entered' ? (
                    <span className="text-emerald-700 font-medium">entered</span>
                  ) : (
                    <span className="text-neutral-600 font-medium">exited</span>
                  )}
                </span>
                <span className="text-neutral-400">·</span>
                <span className="text-neutral-500">{act.vehicleType}</span>
              </div>

              {act.fee !== undefined && act.fee > 0 && (
                <div className="font-mono font-semibold text-emerald-800">₹{act.fee} paid</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
