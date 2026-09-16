import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Package,
  Boxes,
  ScrollText,
  Activity,
  Database,
  Building2
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { ModuleType } from '../../types/procurement';

interface SidebarProps {
  onSelectNav?: () => void; // Optional callback for mobile closing
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelectNav }) => {
  const {
    activeNav,
    setActiveNav,
    getModuleCounts,
    resetAllDataToDefault
  } = useProcurement();

  const handleNavClick = (nav: string) => {
    setActiveNav(nav);
    if (onSelectNav) {
      onSelectNav();
    }
  };

  const modules: { id: ModuleType; label: string; icon: any }[] = [
    { id: 'new-leather', label: 'New Leather Development', icon: Layers },
    { id: 'daily-leather', label: 'Daily Leather Procurement', icon: Package },
    { id: 'material', label: 'Daily Material Procurement', icon: Boxes },
    { id: 'packaging', label: 'Daily Packaging Procurement', icon: ScrollText }
  ];

  return (
    <div className="w-64 h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-base shadow-soft flex-shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
            SAPID ERP
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
            Procurement MIS
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 select-none" aria-label="Main Navigation">
        {/* Dashboard Link */}
        <button
          type="button"
          onClick={() => handleNavClick('dashboard')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeNav === 'dashboard'
              ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shadow-soft-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        {/* Section Divider */}
        <div className="pt-3 pb-1 px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Procurement Modules
        </div>

        {/* 4 Procurement Modules (Clean list without sub-items per user request) */}
        {modules.map(mod => {
          const Icon = mod.icon;
          const isSelected = activeNav === mod.id;
          const counts = getModuleCounts(mod.id);

          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => handleNavClick(mod.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isSelected
                  ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shadow-soft-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                <span className="truncate">{mod.label}</span>
              </div>
              
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {counts.delayed > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full">
                    {counts.delayed}!
                  </span>
                )}
                <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
                  isSelected
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {counts.pending}
                </span>
              </div>
            </button>
          );
        })}

        {/* Audit / System Logs */}
        <div className="pt-3 pb-1 px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          System
        </div>
        <button
          type="button"
          onClick={() => handleNavClick('activity')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeNav === 'activity'
              ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shadow-soft-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Activity Audit Log</span>
        </button>
      </nav>

      {/* Footer Controls */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={resetAllDataToDefault}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Reset database to initial demo values"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </div>
  );
};
