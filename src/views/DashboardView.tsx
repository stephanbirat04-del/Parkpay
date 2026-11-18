import { useState, useMemo } from 'react';
import { VehicleRecord, GateActivityItem, StaffUser, LotSettings, OperatorSession } from '../types';
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
  operatorSessions?: OperatorSession[];
  settings?: LotSettings;
  currentUser?: StaffUser;
  onNavigateToActive: () => void;
}

function getLocalDateKey(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
          <span>{data.exits} {data.exits === 1 ? 'exit' : 'exits'}</span>
          {data.exits > 0 && (
            <>
              <span className="text-neutral-600">•</span>
              <span>~₹{Math.round(data.revenue / data.exits)} / vehicle</span>
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export function DashboardView({
  vehicles,
  gateActivity,
  operatorSessions = [],
  settings,
  currentUser,
  onNavigateToActive,
}: DashboardViewProps) {
  const [chartMode, setChartMode] = useState<'area' | 'bar'>('area');
  const [hoveredHour, setHoveredHour] = useState<{ hour: string; exits: number } | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  const totalCapacity = settings?.totalCapacity || 60;

  const {
    currentlyParkedCount,
    todayRevenue,
    todayRevenueBadge,
    todayExitsCount,
    exitsThisHourCount,
    monthRevenue,
    monthRevenueBadge,
    revenueTrendData,
    sevenDayTotal,
    avgDaily,
    peakDay,
    exitsByHourData,
    maxHourExits,
    peakHourItem,
  } = useMemo(() => {
    const now = new Date();
    const todayKey = getLocalDateKey(now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayKey = getLocalDateKey(yesterday);

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevMonthYear = prevMonthDate.getFullYear();

    const parked = vehicles.filter((v) => v.status === 'Parked');
    const exited = vehicles.filter((v) => v.status === 'Exited');

    // Today's exits
    const exitedTodayList = exited.filter(
      (v) => getLocalDateKey(v.exitTime || v.entryTime) === todayKey
    );
    const paidTodayList = exitedTodayList.filter((v) => v.paymentStatus === 'Paid');
    const unpaidTodayCount = exitedTodayList.filter((v) => v.paymentStatus === 'Unpaid').length;
    const todayRev = paidTodayList.reduce((sum, v) => sum + (v.fee || 0), 0);

    // Yesterday's revenue for day-over-day comparison
    const yesterdayRev = exited
      .filter(
        (v) =>
          getLocalDateKey(v.exitTime || v.entryTime) === yesterdayKey &&
          v.paymentStatus === 'Paid'
      )
      .reduce((sum, v) => sum + (v.fee || 0), 0);

    let revBadge = `${paidTodayList.length} paid`;
    if (yesterdayRev > 0) {
      const diffPct = Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100);
      revBadge = `${diffPct >= 0 ? '+' : ''}${diffPct}% vs yest`;
    } else if (unpaidTodayCount > 0) {
      revBadge = `${paidTodayList.length} paid · ${unpaidTodayCount} unpaid`;
    }

    // Exits in last 60 minutes
    const oneHourAgoMs = now.getTime() - 60 * 60 * 1000;
    const lastHourExits = exitedTodayList.filter((v) => {
      const t = new Date(v.exitTime || v.entryTime).getTime();
      return !isNaN(t) && t >= oneHourAgoMs && t <= now.getTime();
    }).length;

    // Month revenue & previous month comparison
    let curMonthRev = 0;
    let lastMonthRev = 0;
    for (const v of exited) {
      if (v.paymentStatus !== 'Paid') continue;
      const d = new Date(v.exitTime || v.entryTime);
      if (isNaN(d.getTime())) continue;
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        curMonthRev += v.fee || 0;
      } else if (d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear) {
        lastMonthRev += v.fee || 0;
      }
    }

    let mBadge = now.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    if (lastMonthRev > 0) {
      const diffPct = Math.round(((curMonthRev - lastMonthRev) / lastMonthRev) * 100);
      mBadge = `${diffPct >= 0 ? '+' : ''}${diffPct}% vs last mo`;
    }

    // Past 7 days revenue & exits ending today
    const dayStatsMap = new Map<string, { revenue: number; exits: number }>();
    for (const v of exited) {
      const key = getLocalDateKey(v.exitTime || v.entryTime);
      if (!key) continue;
      const current = dayStatsMap.get(key) || { revenue: 0, exits: 0 };
      current.exits += 1;
      if (v.paymentStatus === 'Paid') {
        current.revenue += v.fee || 0;
      }
      dayStatsMap.set(key, current);
    }

    const trend = [];
    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date(now);
      d.setDate(now.getDate() - offset);
      const key = getLocalDateKey(d);
      const isToday = offset === 0;
      const dayShort = d
        .toLocaleDateString('en-US', { weekday: 'short' })
        .toUpperCase();
      const dateFormatted = d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      const stats = dayStatsMap.get(key) || { revenue: 0, exits: 0 };
      trend.push({
        day: dayShort,
        dateLabel: isToday ? `${dateFormatted} (Today)` : dateFormatted,
        revenue: stats.revenue,
        exits: stats.exits,
        isToday,
      });
    }

    const total7 = trend.reduce((acc, d) => acc + d.revenue, 0);
    const avg7 = Math.round(total7 / 7);
    const topDay = [...trend].sort((a, b) => b.revenue - a.revenue)[0];

    // Today's exits by 2-hour bucket (00, 02, 04, ..., 22)
    const buckets: { hour: string; exits: number }[] = [];
    for (let h = 0; h < 24; h += 2) {
      buckets.push({ hour: String(h).padStart(2, '0'), exits: 0 });
    }
    for (const v of exitedTodayList) {
      const d = new Date(v.exitTime || v.entryTime);
      if (isNaN(d.getTime())) continue;
      const bucketIdx = Math.floor(d.getHours() / 2);
      if (buckets[bucketIdx]) {
        buckets[bucketIdx].exits += 1;
      }
    }

    const maxExits = Math.max(0, ...buckets.map((b) => b.exits));
    const peakBucket = buckets.reduce(
      (best, cur) => (cur.exits > best.exits ? cur : best),
      buckets[0]
    );

    return {
      currentlyParkedCount: parked.length,
      todayRevenue: todayRev,
      todayRevenueBadge: revBadge,
      todayExitsCount: exitedTodayList.length,
      exitsThisHourCount: lastHourExits,
      monthRevenue: curMonthRev,
      monthRevenueBadge: mBadge,
      revenueTrendData: trend,
      sevenDayTotal: total7,
      avgDaily: avg7,
      peakDay: topDay,
      exitsByHourData: buckets,
      maxHourExits: maxExits,
      peakHourItem: peakBucket,
    };
  }, [vehicles]);

  const activeOperatorsCount = operatorSessions.filter(
    (s) => s.status === 'active' && s.operatorRole !== 'admin'
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Dashboard</h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Live view of {settings?.lotName || 'lot'} occupancy and revenue.
        </p>
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
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-neutral-900 tabular-nums">
                {currentlyParkedCount}
              </span>
              <span className="text-xs font-mono text-neutral-400">
                / {totalCapacity}
              </span>
            </div>
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
            <span className="text-xs font-semibold text-neutral-500">Today&apos;s revenue</span>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center">
              {todayRevenueBadge}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-neutral-900 tabular-nums">
              ₹{todayRevenue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Today's exits */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Today&apos;s exits</span>
            <span className="text-[11px] text-neutral-400 font-medium">
              {exitsThisHourCount} this hour
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-neutral-900 tabular-nums">
              {todayExitsCount}
            </span>
          </div>
        </div>

        {/* Month revenue - visible only to Admin */}
        {isAdmin && (
          <div className="bg-white p-5 rounded-xl border border-neutral-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500">Month revenue</span>
              <span className="text-[11px] font-semibold text-emerald-700">
                {monthRevenueBadge}
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold font-mono text-neutral-900 tabular-nums">
                ₹{monthRevenue.toLocaleString('en-IN')}
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
                    Daily collections &amp; traffic for the past 7 days
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
                        domain={[0, 'auto']}
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
                        domain={[0, 'auto']}
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
                <span className="text-neutral-400 block text-[10px] font-medium">
                  {peakDay && peakDay.revenue > 0 ? `Peak (${peakDay.day})` : 'Peak Day'}
                </span>
                <span className="font-mono font-bold text-emerald-800 text-xs">
                  {peakDay && peakDay.revenue > 0
                    ? `₹${peakDay.revenue.toLocaleString('en-IN')}`
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Today's exits by hour */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-900">Today&apos;s exits by hour</h3>
            <span className="text-xs text-neutral-400 font-mono">
              {hoveredHour
                ? `${hoveredHour.hour}:00 · ${hoveredHour.exits} exits`
                : maxHourExits > 0
                ? `Peak at ${peakHourItem.hour}:00`
                : 'No exits today'}
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-1 border-b border-neutral-100">
            {exitsByHourData.map((item) => {
              const heightPct =
                maxHourExits > 0 ? Math.max(item.exits > 0 ? 8 : 0, Math.round((item.exits / maxHourExits) * 100)) : 0;
              const isHovered = hoveredHour?.hour === item.hour;
              return (
                <div
                  key={item.hour}
                  onMouseEnter={() => setHoveredHour(item)}
                  onMouseLeave={() => setHoveredHour(null)}
                  className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                >
                  <div className="w-full relative flex items-end justify-center h-32">
                    {heightPct > 0 ? (
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[28px] rounded-t-sm transition-all duration-150 ${
                          isHovered ? 'bg-emerald-900' : 'bg-emerald-700/85 hover:bg-emerald-800'
                        }`}
                      />
                    ) : (
                      <div className="w-full max-w-[28px] h-[2px] bg-neutral-100 rounded" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-neutral-500">{item.hour}</span>
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
            <span>
              {activeOperatorsCount > 0
                ? `${activeOperatorsCount} ${activeOperatorsCount === 1 ? 'operator' : 'operators'} on duty`
                : 'Live sync'}
            </span>
          </div>
        </div>

        <div className="divide-y divide-neutral-100/90 mt-2">
          {gateActivity.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No gate activity recorded yet. Vehicle entries and exits will appear here in real time.
            </div>
          ) : (
            gateActivity.slice(0, 5).map((act) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
