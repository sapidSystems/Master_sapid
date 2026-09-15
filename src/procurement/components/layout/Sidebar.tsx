import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Package,
  Boxes,
  ScrollText,
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
    { id: 'material', label: 'Daily Material Procurement', icon: Boxes }
  ];

  return (
    <div className="w-64 h-full flex flex-col bg-white border-r border-slate-200 transition-colors">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-base shadow-soft flex-shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-sm tracking-tight text-slate-900 uppercase leading-tight">
            SAPID ERP
          </div>
          <div className="text-[11px] font-medium text-slate-500 truncate">
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
              ? 'bg-brand-50 text-brand-600 shadow-soft-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        {/* Section Divider */}
        <div className="pt-3 pb-1 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Procurement Modules
        </div>

        {/* Procurement Modules */}
        {modules.map(mod => {
          const Icon = mod.icon;
          const isSelected = activeNav === mod.id || (mod.id === 'material' && activeNav === 'packaging');
          const counts = mod.id === 'material' ? {
            pending: getModuleCounts('material').pending + getModuleCounts('packaging').pending,
            delayed: getModuleCounts('material').delayed + getModuleCounts('packaging').delayed,
            history: getModuleCounts('material').history + getModuleCounts('packaging').history,
            onTime: getModuleCounts('material').onTime + getModuleCounts('packaging').onTime,
          } : getModuleCounts(mod.id);

          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => handleNavClick(mod.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isSelected
                  ? 'bg-brand-50 text-brand-600 shadow-soft-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                <span className="truncate">{mod.label}</span>
              </div>
              
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {counts.delayed > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-600 rounded-full">
                    {counts.delayed}!
                  </span>
                )}
                <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
                  isSelected
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {counts.pending}
                </span>
              </div>
            </button>
          );
        })}

      </nav>

      {/* Footer Controls */}
      <div className="p-3 border-t border-slate-200">
        <button
          type="button"
          onClick={resetAllDataToDefault}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Reset database to initial demo values"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </div>
  );
};
