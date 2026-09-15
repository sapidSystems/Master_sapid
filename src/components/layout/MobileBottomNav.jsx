import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  Database,
  TrendingUp,
  Boxes,
  LayoutGrid
} from 'lucide-react';

export default function MobileBottomNav({ onOpenLauncher, isLauncherOpen }) {
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

  const tabs = [
    {
      id: 'checklist',
      label: 'Checklist',
      href: '/dashboard/admin',
      icon: ClipboardList,
      isActive: isChecklistPath(location.pathname) && !isLauncherOpen
    },
    {
      id: 'sample',
      label: 'Sample',
      href: '/dashboard/sample-dashboard',
      icon: Database,
      isActive: isSamplePath(location.pathname) && !isLauncherOpen
    },
    {
      id: 'bulk',
      label: 'Planning',
      href: '/dashboard/bulk-dashboard',
      icon: TrendingUp,
      isActive: isBulkPath(location.pathname) && !isLauncherOpen
    },
    {
      id: 'procurement',
      label: 'Procure',
      href: '/dashboard/procurement',
      icon: Boxes,
      isActive: isProcurementPath(location.pathname) && !isLauncherOpen
    },
    {
      id: 'launcher',
      label: 'Systems',
      action: onOpenLauncher,
      icon: LayoutGrid,
      isActive: isLauncherOpen
    }
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)'
      }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-around px-1 pt-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const content = (
            <>
              <div
                className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-150 ${
                  tab.isActive
                    ? 'bg-brand-50 text-brand-600 font-bold scale-105'
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                <Icon size={20} strokeWidth={tab.isActive ? 2.4 : 1.9} />
                {tab.isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-brand-600" />
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight leading-tight mt-0.5 transition-colors ${
                  tab.isActive
                    ? 'font-bold text-brand-600'
                    : 'font-medium text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </>
          );

          if (tab.action) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={tab.action}
                className="group flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 cursor-pointer select-none"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              to={tab.href}
              className="group flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 select-none"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
