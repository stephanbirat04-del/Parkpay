import { useState } from 'react';
import { VehicleRecord, GateActivityItem, StaffUser } from '../types';
import { REVENUE_TREND_DAYS, EXITS_BY_HOUR } from '../utils/initialData';
import { ArrowUpRight, Lock, TrendingUp, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DashboardViewProps {
  vehicles: VehicleRecord[];
  gateActivity: GateActivityItem[];
  currentUser?: StaffUser;
  onNavigateToActive: () => void;
}

function RevenueTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-neutral-900 text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-neutral-800 text-xs select-none">
        <div className="text-[11px] text-neutral-400 font-medium flex items-center justify-between gap-3">
          <span>{data.dateLabel}</span>
          {data.isToday && (
            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold text-[9px] rounded">
              TODAY
            </span>
          )}
        </div>
        <div className="text-base font-bold font-mono text-emerald-400 mt-1">
          ₹{data.revenue.toLocaleString('en-IN')}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-neutral-300">
          <span>{data.exits} exits</span>
          <span className="text-neutral-600">•</span>
          <span>~₹{Math.round(data.revenue / (data.exits || 1))} / car</span>
        </div>
      </div>
    );
  }
  return null;
}

export function DashboardView({
  vehicles,
  gateActivity,
  currentUser,
  onNavigateToActive,
}: DashboardViewProps) {
  const [chartMode, setChartMode] = useState<'area' | 'bar'>('area');
  const [hoveredHour, setHoveredHour] = useState<{ hour: string; exits: number } | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Dynamic calculations
  const currentlyParkedCount = vehicles.filter((v) => v.status === 'Parked').length;
  const exitedToday = vehicles.filter((v) => v.status === 'Exited');
  const exitedCount = exitedToday.length;
  
  // Base today revenue calculation plus exited vehicles fee sum
  const dynamicExitRevenue = exitedToday.reduce((sum, v) => sum + (v.fee || 0), 0);
  const revenueCalculated = 18450 + dynamicExitRevenue;
  const monthRevenue = '₹4,28,900';

  // Find max for bar scaling
  const maxHourExits = Math.max(...EXITS_BY_HOUR.map((h) => h.exits));

  // Past 7 days data for Recharts visualization
  const revenueTrendData = REVENUE_TREND_DAYS.map((item) => {
    const isToday = !!item.isToday;
    const finalAmount = isToday ? revenueCalculated : item.amount;
    return {
      day: item.day,
      dateLabel:
        item.day === 'WED' ? 'Wed, 17 Sep' :
        item.day === 'THU' ? 'Thu, 18 Sep' :
        item.day === 'FRI' ? 'Fri, 19 Sep' :
        item.day === 'SAT' ? 'Sat, 20 Sep' :
        item.day === 'SUN' ? 'Sun, 21 Sep' :
        item.day === 'MON' ? 'Mon, 22 Sep' :
        'Tue, 23 Sep (Today)',
      revenue: finalAmount,
      exits: item.exits,
      isToday,
    };
  });

  const sevenDayTotal = revenueTrendData.reduce((acc, d) => acc + d.revenue, 0);
  const avgDaily = Math.round(sevenDayTotal / revenueTrendData.length);
  const peakDay = [...revenueTrendData].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Dashboard</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Live view of lot occupancy and revenue.</p>
      </div>

      {/* Stat Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
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

        {/* Month revenue - visible only to Admin */}
        {isAdmin && (
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
        )}
      </div>

      {/* Visual charts: Admin-only 7-day revenue trend with Recharts & Today's exits by hour */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : ''} gap-5`}>
        {/* 7-day revenue trend (recharts) - visible only to admin */}
        {isAdmin && (
          <div className="bg-white p-5 rounded-xl border border-neutral-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900">7-Day Revenue Trend</h3>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                      <Lock className="w-2.5 h-2.5 text-amber-700" />
                      Admin Only
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Daily collections & traffic for the past 7 days
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="bg-neutral-100 p-0.5 rounded-lg flex items-center text-[11px] font-medium text-neutral-600">
                    <button
                      type="button"
                      onClick={() => setChartMode('area')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        chartMode === 'area'
                          ? 'bg-white text-emerald-900 font-semibold shadow-2xs'
                          : 'hover:text-neutral-900'
                      }`}
                      title="Smooth Area Trend"
                    >
                      <TrendingUp className="w-3 h-3 text-emerald-700" />
                      <span>Trend</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMode('bar')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        chartMode === 'bar'
                          ? 'bg-white text-emerald-900 font-semibold shadow-2xs'
                          : 'hover:text-neutral-900'
                      }`}
                      title="Daily Bar Comparison"
                    >
                      <BarChart3 className="w-3 h-3 text-emerald-700" />
                      <span>Bars</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recharts Chart Container */}
              <div className="h-52 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  {chartMode === 'area' ? (
                    <AreaChart
                      data={revenueTrendData}
                      margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.32} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F0" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <YAxis
                        tickFormatter={(val) => `₹${val >= 1000 ? Math.round(val / 1000) + 'k' : val}`}
                        tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'monospace' }}
                        tickLine={false}
                        axisLine={false}
                        domain={['dataMin - 3000', 'dataMax + 2000']}
                      />
                      <Tooltip content={<RevenueTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#047857"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#revenueAreaGrad)"
                        dot={{ r: 3.5, fill: '#047857', stroke: '#FFFFFF', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#065F46', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart
                      data={revenueTrendData}
                      margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F0" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <YAxis
                        tickFormatter={(val) => `₹${val >= 1000 ? Math.round(val / 1000) + 'k' : val}`}
                        tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'monospace' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<RevenueTooltip />} />
                      <Bar
                        dataKey="revenue"
                        fill="#047857"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Metrics summary footer */}
            <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-neutral-100 text-[11px]">
              <div>
                <span className="text-neutral-400 block text-[10px] font-medium">7-Day Total</span>
                <span className="font-mono font-bold text-neutral-900 text-xs">
                  ₹{sevenDayTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] font-medium">Daily Average</span>
                <span className="font-mono font-bold text-neutral-900 text-xs">
                  ₹{avgDaily.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] font-medium">Peak ({peakDay.day})</span>
                <span className="font-mono font-bold text-emerald-800 text-xs">
                  ₹{peakDay.revenue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}

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
