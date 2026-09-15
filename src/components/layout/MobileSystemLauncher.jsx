import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  Database,
  TrendingUp,
  Boxes,
  Settings,
  X,
  ChevronRight
} from 'lucide-react';

export default function MobileSystemLauncher({
  menuCounts = {},
  onClose = null,
  isModal = false,
  pageAccess = {},
  userRole = 'user'
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const isChecklistPath = (p) => {
    const paths = [
      '/dashboard/admin',
      '/dashboard/notifications',
      '/dashboard/quick-task',
      '/dashboard/checklist',
      '/dashboard/maintenance',
      '/dashboard/repair',
      '/dashboard/ea-task',
      '/dashboard/assign-task',
      '/dashboard/delegation',
      '/dashboard/delegation-data',
      '/dashboard/task',
      '/dashboard/calendar',
      '/dashboard/holiday-list',
      '/dashboard/working-day-calendar',
      '/dashboard/admin-approval',
      '/dashboard/training-video',
      '/dashboard/data',
      '/dashboard/admin-data',
      '/dashboard/mis-report',
      '/dashboard/demo'
    ];
    return paths.some((cp) => p === cp || p.startsWith(cp + '/'));
  };

  const isSamplePath = (p) => p.startsWith('/dashboard/sample');
  const isBulkPath = (p) => p.startsWith('/dashboard/bulk');
  const isProcurementPath = (p) => p.startsWith('/dashboard/procurement');

  const role = (userRole || 'user').toLowerCase();
  const isAdmin = role === 'admin';

  const hasAccess = (href) => {
    if (isAdmin) return true;
    const exceptionPaths = [
      '/dashboard/admin',
      '/dashboard/notifications',
      '/dashboard/training-video',
      '/dashboard/procurement'
    ];
    if (exceptionPaths.some((ep) => href === ep || href.startsWith(ep + '/'))) return true;
    const perm = pageAccess[href];
    return perm && perm !== 'none';
  };

  const systems = [
    {
      id: 'checklist',
      name: 'Checklist',
      subtitle: 'Operations & Tasks',
      href: '/dashboard/admin',
      icon: ClipboardList,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200/70',
      activeBorder: 'ring-2 ring-purple-500 border-purple-500',
      badge:
        ((menuCounts.delegation || 0) +
          (menuCounts.task || 0) +
          (menuCounts.adminApproval || 0)) ||
        null,
      isActive: isChecklistPath(location.pathname),
      accessible: true
    },
    {
      id: 'sample',
      name: 'Sample System',
      subtitle: 'Sampling & R&D',
      href: '/dashboard/sample-dashboard',
      icon: Database,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200/70',
      activeBorder: 'ring-2 ring-blue-500 border-blue-500',
      badge: menuCounts.sampleManagement || null,
      isActive: isSamplePath(location.pathname),
      accessible: hasAccess('/dashboard/sample-dashboard') || hasAccess('/dashboard/sample-management')
    },
    {
      id: 'bulk',
      name: 'Production Planning',
      subtitle: 'Bulk Orders & Plan',
      href: '/dashboard/bulk-dashboard',
      icon: TrendingUp,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200/70',
      activeBorder: 'ring-2 ring-emerald-500 border-emerald-500',
      badge: menuCounts.productionPlanning || null,
      isActive: isBulkPath(location.pathname),
      accessible: hasAccess('/dashboard/bulk-dashboard') || hasAccess('/dashboard/bulk-order')
    },
    {
      id: 'procurement',
      name: 'Procurement System',
      subtitle: 'Materials & MIS',
      href: '/dashboard/procurement',
      icon: Boxes,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200/70',
      activeBorder: 'ring-2 ring-amber-500 border-amber-500',
      badge: null,
      isActive: isProcurementPath(location.pathname),
      accessible: hasAccess('/dashboard/procurement')
    },
    {
      id: 'setting',
      name: 'Settings',
      subtitle: 'Master Config',
      href: '/dashboard/setting',
      icon: Settings,
      iconColor: 'text-slate-600',
      bgColor: 'bg-slate-100',
      borderColor: 'border-slate-200/70',
      activeBorder: 'ring-2 ring-slate-500 border-slate-500',
      badge: null,
      isActive: location.pathname === '/dashboard/setting',
      accessible: isAdmin
    }
  ].filter((s) => s.accessible);

  const handleTileClick = (href) => {
    navigate(href);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`w-full bg-white ${isModal ? 'p-4 sm:p-5' : 'p-3.5'}`}>
      {/* Optional Modal Header */}
      {isModal && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Systems Launcher
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Select a system to navigate
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close launcher"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}

      {/* Grid of System Tiles */}
      <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
        {systems.map((system) => {
          const Icon = system.icon;
          return (
            <button
              key={system.id}
              type="button"
              onClick={() => handleTileClick(system.href)}
              className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl bg-white border text-center transition-all duration-150 active:scale-95 shadow-sm hover:shadow-md aspect-square min-h-[76px] min-w-[76px] cursor-pointer ${
                system.isActive
                  ? `${system.activeBorder} bg-slate-50/50`
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Badge for Pending Items */}
              {system.badge !== null && system.badge > 0 && (
                <span className="absolute top-2 right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-sm">
                  {system.badge}
                </span>
              )}

              {/* Icon Tile */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-1.5 transition-transform duration-200 group-hover:scale-105 ${system.bgColor} border ${system.borderColor}`}
              >
                <Icon className={`w-5 h-5 ${system.iconColor}`} />
              </div>

              {/* System Name */}
              <span className="text-xs font-bold text-slate-800 tracking-tight leading-tight line-clamp-1 w-full">
                {system.name}
              </span>

              {/* Subtitle */}
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 line-clamp-1 w-full">
                {system.subtitle}
              </span>

              {/* Active Indicator Dot */}
              {system.isActive && (
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Status Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-[10px]">
          SAPID Enterprise
        </span>
        <span className="flex items-center gap-1 text-slate-500 font-medium">
          Tap any tile to launch <ChevronRight size={12} />
        </span>
      </div>
    </div>
  );
}
