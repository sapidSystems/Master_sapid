import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  Database,
  TrendingUp,
  Boxes,
  Settings,
  X,
  ChevronRight,
  LayoutGrid
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
    const perm = pageAccess[href];
    if (perm !== undefined && perm !== null) {
      return perm !== 'none';
    }
    const exceptionPaths = [
      '/dashboard/admin',
      '/dashboard/notifications',
      '/dashboard/training-video'
    ];
    if (exceptionPaths.some((ep) => href === ep || href.startsWith(ep + '/'))) return true;
    if (isProcurementPath(href)) return true;
    return false;
  };

  const systems = [
    {
      id: 'unified',
      name: 'Unified Dashboard',
      subtitle: 'All Pipelines & Home',
      href: '/dashboard',
      icon: LayoutGrid,
      iconColor: 'text-leather-800',
      bgColor: 'bg-cream-100',
      borderColor: 'border-leather-200',
      activeBorder: 'ring-2 ring-gold-400 border-leather-700',
      badge: null,
      isActive: location.pathname === '/dashboard',
      accessible: true
    },
    {
      id: 'checklist',
      name: 'Checklist',
      subtitle: 'Operations & Tasks',
      href: '/dashboard/admin',
      icon: ClipboardList,
      iconColor: 'text-leather-700',
      bgColor: 'bg-cream-100',
      borderColor: 'border-leather-200',
      activeBorder: 'ring-2 ring-gold-400 border-leather-700',
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
      iconColor: 'text-gold-700',
      bgColor: 'bg-gold-50/70',
      borderColor: 'border-gold-200',
      activeBorder: 'ring-2 ring-gold-400 border-gold-600',
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
      iconColor: 'text-leather-700',
      bgColor: 'bg-cream-100',
      borderColor: 'border-leather-200',
      activeBorder: 'ring-2 ring-gold-400 border-leather-700',
      badge: ((menuCounts.productionPlanning || 0) + (menuCounts.productionApproval || 0) + (menuCounts.productionMonitoring || 0)) || null,
      isActive: isBulkPath(location.pathname),
      accessible: hasAccess('/dashboard/bulk-dashboard') || hasAccess('/dashboard/bulk-order')
    },
    {
      id: 'procurement',
      name: 'Procurement System',
      subtitle: 'Materials & MIS',
      href: '/dashboard/procurement',
      icon: Boxes,
      iconColor: 'text-gold-700',
      bgColor: 'bg-gold-50/70',
      borderColor: 'border-gold-200',
      activeBorder: 'ring-2 ring-gold-400 border-gold-600',
      badge: ((menuCounts?.procurementNewLeather || 0) + (menuCounts?.procurementDailyLeather || 0) + (menuCounts?.procurementMaterial || 0)) || null,
      isActive: isProcurementPath(location.pathname),
      accessible: hasAccess('/dashboard/procurement') || hasAccess('/dashboard/procurement/new-leather') || hasAccess('/dashboard/procurement/daily-leather') || hasAccess('/dashboard/procurement/material')
    },
    {
      id: 'setting',
      name: 'Settings',
      subtitle: 'Master Config',
      href: '/dashboard/setting',
      icon: Settings,
      iconColor: 'text-leather-600',
      bgColor: 'bg-cream-50',
      borderColor: 'border-leather-200',
      activeBorder: 'ring-2 ring-leather-500 border-leather-700',
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
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-leather-100">
          <div>
            <h2 className="text-base font-extrabold text-leather-900 tracking-tight font-serif">
              Systems Launcher
            </h2>
            <p className="text-[11px] text-leather-600 font-medium">
              Select a system to navigate
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-leather-400 hover:text-leather-700 hover:bg-cream-100 transition-colors"
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
              className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl bg-white border text-center transition-all duration-150 active:scale-95 shadow-xs hover:shadow-md aspect-square min-h-[76px] min-w-[76px] cursor-pointer ${
                system.isActive
                  ? `${system.activeBorder} bg-cream-50/70`
                  : 'border-leather-200/80 hover:border-gold-300'
              }`}
            >
              {/* Badge for Pending Items */}
              {system.badge !== null && system.badge > 0 && (
                <span className="absolute top-2 right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-xs">
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
              <span className="text-xs font-bold text-leather-900 tracking-tight leading-tight line-clamp-1 w-full font-serif">
                {system.name}
              </span>

              {/* Subtitle */}
              <span className="text-[10px] text-leather-500 font-medium mt-0.5 line-clamp-1 w-full">
                {system.subtitle}
              </span>

              {/* Active Indicator Dot */}
              {system.isActive && (
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Status Bar */}
      <div className="mt-4 pt-3 border-t border-leather-100 flex items-center justify-between text-[11px] text-leather-500">
        <span className="font-semibold uppercase tracking-wider text-[10px]">
          SAPID Enterprise
        </span>
        <span className="flex items-center gap-1 text-leather-600 font-medium">
          Tap any tile to launch <ChevronRight size={12} />
        </span>
      </div>
    </div>
  );
}
