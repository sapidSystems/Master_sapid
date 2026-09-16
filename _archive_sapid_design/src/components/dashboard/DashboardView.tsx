import React from 'react';
import {
  Layers,
  Package,
  Boxes,
  ScrollText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { ModuleType } from '../../types/procurement';
import { formatDateTime } from '../../utils/dateUtils';

interface DashboardViewProps {
  onOpenCreate: (module: ModuleType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenCreate }) => {
  const {
    getDashboardStats,
    setActiveNav,
    setActiveTab,
    activityLogs
  } = useProcurement();

  const stats = getDashboardStats();

  const goToModule = (nav: string, tab: 'pending' | 'history' = 'pending') => {
    setActiveNav(nav);
    setActiveTab(tab);
  };

  // 4 Top Cards (Req #52: Desktop 4, Tablet 2, Mobile 1 per row)
  const metricCards = [
    {
      title: 'Pending Leather Development',
      count: stats.newLeatherPending,
      description: 'Sampling & lab dip orders awaiting receipt',
      badge: stats.newLeatherPending > 0 ? 'Requires Action' : 'All Clear',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
      icon: Layers,
      iconBg: 'bg-blue-500/10 text-brand-600 dark:text-brand-400',
      nav: 'new-leather'
    },
    {
      title: 'Daily Leather Procurement',
      count: stats.dailyLeatherPending,
      description: 'Work order bulk hide shipments in transit',
      badge: 'Active Orders',
      badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
      icon: Package,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      nav: 'daily-leather'
    },
    {
      title: 'Material Procurement',
      count: stats.materialsPending,
      description: 'Linings, threads, eyelets & hardware items',
      badge: 'Production Inflow',
      badgeColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
      icon: Boxes,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      nav: 'material'
    },
    {
      title: 'Packaging Procurement',
      count: stats.packagingPending,
      description: 'Shoe boxes, hangtags & master cartons',
      badge: 'Packing Line Ready',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
      icon: ScrollText,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      nav: 'packaging'
    }
  ];

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Alert if any Delayed orders exist */}
      {stats.totalDelayed > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                {stats.totalDelayed} Procurement Order{stats.totalDelayed > 1 ? 's' : ''} Delayed Beyond Target Date
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                Immediate follow-up required with respective tanneries and hardware suppliers to avoid production downtime.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => goToModule('daily-leather', 'pending')}
            className="self-start sm:self-auto min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-soft whitespace-nowrap"
          >
            Review Delayed Orders
          </button>
        </div>
      )}

      {/* 4 Cards Grid (Req #52: 4 Desktop / 2 Tablet / 1 Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => goToModule(card.nav, 'pending')}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-soft-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {card.title}
                </div>
                {/* Large Number (Req #52) */}
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 mb-1 tracking-tight">
                  {card.count}
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="truncate pr-2">{card.description}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Section: Procurement Status Breakdown & Quick Action shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Status Distribution Card */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Procurement Pipeline Health
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Overall tracking across all active supply chains
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Total {stats.totalPending + stats.totalCompleted} Records
            </span>
          </div>

          {/* Graphical Pipeline Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
              {stats.totalOnTime > 0 && (
                <div 
                  style={{ width: `${(stats.totalOnTime / Math.max(1, stats.totalPending + stats.totalCompleted)) * 100}%` }}
                  className="bg-blue-500 h-full transition-all"
                  title={`On-time: ${stats.totalOnTime}`}
                />
              )}
              {stats.totalDelayed > 0 && (
                <div 
                  style={{ width: `${(stats.totalDelayed / Math.max(1, stats.totalPending + stats.totalCompleted)) * 100}%` }}
                  className="bg-rose-500 h-full transition-all"
                  title={`Delayed: ${stats.totalDelayed}`}
                />
              )}
              {stats.totalCompleted > 0 && (
                <div 
                  style={{ width: `${(stats.totalCompleted / Math.max(1, stats.totalPending + stats.totalCompleted)) * 100}%` }}
                  className="bg-emerald-500 h-full transition-all"
                  title={`Completed: ${stats.totalCompleted}`}
                />
              )}
            </div>

            {/* Legend / Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 block">● On-time Pending</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.totalOnTime}</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 block">● Delayed Alert</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.totalDelayed}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block">● History Completed</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.totalCompleted}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 block">● Total In-Transit</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.totalPending}</span>
              </div>
            </div>
          </div>

          {/* Quick Add Buttons Row */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
              Quick Procurement Actions
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => onOpenCreate('new-leather')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-brand-600" />
                <span className="truncate">New Leather</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCreate('daily-leather')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-brand-600" />
                <span className="truncate">+ Daily Leather</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCreate('material')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-brand-600" />
                <span className="truncate">+ Material</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCreate('packaging')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-brand-600" />
                <span className="truncate">+ Packaging</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Audit Trail
              </h3>
              <button
                type="button"
                onClick={() => goToModule('activity')}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
              >
                View all
              </button>
            </div>

            <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/80">
              {activityLogs.slice(0, 4).map((log, lIdx) => (
                <div key={log.id || lIdx} className={`${lIdx > 0 ? 'pt-3' : ''} text-xs`}>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{log.user}</span>
                    <span>{formatDateTime(log.timestamp).split(',')[0]}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 line-clamp-2">
                    <strong className="text-brand-600 dark:text-brand-400 font-semibold">{log.action}: </strong>
                    {log.details}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
            Transactions synchronized with browser LocalStorage
          </div>
        </div>
      </div>
    </div>
  );
};
