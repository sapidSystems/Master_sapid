import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bell,
  Zap,
  UserPlus,
  Users,
  CheckSquare,
  Calendar,
  CalendarDays,
  CalendarCheck,
  ShieldCheck,
  Video,
  Layers,
  TrendingUp,
  Sparkles,
  ScrollText,
  Boxes,
  Settings,
  FileText,
  LayoutGrid
} from 'lucide-react';

// Icon mapping per page route
const pageIconMap = {
  '/dashboard/admin': LayoutDashboard,
  '/dashboard/notifications': Bell,
  '/dashboard/quick-task': Zap,
  '/dashboard/assign-task': UserPlus,
  '/dashboard/delegation': Users,
  '/dashboard/task': CheckSquare,
  '/dashboard/calendar': Calendar,
  '/dashboard/holiday-list': CalendarDays,
  '/dashboard/working-day-calendar': CalendarCheck,
  '/dashboard/admin-approval': ShieldCheck,
  '/dashboard/training-video': Video,
  '/dashboard/sample-dashboard': LayoutDashboard,
  '/dashboard/sample-management': Layers,
  '/dashboard/bulk-dashboard': LayoutDashboard,
  '/dashboard/bulk-order': TrendingUp,
  '/dashboard/procurement': LayoutDashboard,
  '/dashboard/procurement/new-leather': Sparkles,
  '/dashboard/procurement/daily-leather': ScrollText,
  '/dashboard/procurement/material': Boxes,
  '/dashboard/setting': Settings,
};

export default function MobileBottomNav({
  accessibleRoutes = [],
  onOpenLauncher,
  isLauncherOpen = false
}) {
  const location = useLocation();
  const currentPath = location.pathname;
  const scrollContainerRef = useRef(null);

  // Identify active system based on currentPath
  const isSample = currentPath.startsWith('/dashboard/sample');
  const isBulk = currentPath.startsWith('/dashboard/bulk');
  const isProcurement = currentPath.startsWith('/dashboard/procurement');
  const isSetting = currentPath.startsWith('/dashboard/setting');

  let activeSystemLabel = 'Checklist';
  if (isSample) activeSystemLabel = 'Sample System';
  else if (isBulk) activeSystemLabel = 'Production Planning and Monitoring';
  else if (isProcurement) activeSystemLabel = 'Procurement System';
  else if (isSetting) activeSystemLabel = 'Settings';

  // Find the active system route configuration from accessibleRoutes
  const currentSystemRoute = accessibleRoutes.find((r) => {
    if (activeSystemLabel === 'Settings') return r.label === 'Settings' || r.href === '/dashboard/setting';
    return r.label === activeSystemLabel;
  });

  // Extract the context-sensitive pages for ONLY this current system
  let systemPages = [];
  if (currentSystemRoute && currentSystemRoute.subItems && currentSystemRoute.subItems.length > 0) {
    systemPages = currentSystemRoute.subItems;
  } else if (currentSystemRoute && currentSystemRoute.href) {
    // Single page system (e.g. Settings)
    systemPages = [
      {
        href: currentSystemRoute.href,
        label: currentSystemRoute.label,
        active: currentPath === currentSystemRoute.href
      }
    ];
  }

  // Fallback defaults if accessibleRoutes is still loading
  if (systemPages.length === 0) {
    if (isSample) {
      systemPages = [
        { href: '/dashboard/sample-dashboard', label: 'Dashboard' },
        { href: '/dashboard/sample-management', label: 'Samples' }
      ];
    } else if (isBulk) {
      systemPages = [
        { href: '/dashboard/bulk-dashboard', label: 'Dashboard' },
        { href: '/dashboard/bulk-order', label: 'Planning' }
      ];
    } else if (isProcurement) {
      systemPages = [
        { href: '/dashboard/procurement', label: 'Dashboard' },
        { href: '/dashboard/procurement/new-leather', label: 'New Leather' },
        { href: '/dashboard/procurement/daily-leather', label: 'Daily Leather' },
        { href: '/dashboard/procurement/material', label: 'Material & Pkg' }
      ];
    } else if (!isSetting) {
      systemPages = [
        { href: '/dashboard/admin', label: 'Dashboard' },
        { href: '/dashboard/notifications', label: 'Alerts' },
        { href: '/dashboard/task', label: 'Tasks' },
        { href: '/dashboard/delegation', label: 'Delegation' },
        { href: '/dashboard/calendar', label: 'Calendar' }
      ];
    }
  }

  // Auto-scroll active item into view horizontally
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentPath]);

  // If a single page system and user preferred to omit, we still provide clean switcher
  const isMultiPage = systemPages.length > 1;

  return (
    <nav
      aria-label="Mobile Navigation"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)'
      }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-leather-200/90 shadow-[0_-4px_20px_rgba(74,46,31,0.08)]"
    >
      <div className="flex items-stretch h-14">
        {/* SEPARATE CONTROL FOR SYSTEM SWITCHING (LEVEL 1 LAUNCHER TOGGLE) */}
        <div className="flex items-center pl-1.5 pr-2 border-r border-leather-200/80 my-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenLauncher}
            className={`group flex flex-col items-center justify-center h-full px-2.5 rounded-xl transition-all active:scale-95 cursor-pointer ${
              isLauncherOpen
                ? 'bg-leather-800 text-cream-100 shadow-xs font-bold border border-gold-400/30'
                : 'text-leather-700 hover:text-leather-950 hover:bg-cream-100'
            }`}
            title="Switch Systems"
            aria-label="Switch Systems"
          >
            <LayoutGrid size={19} strokeWidth={isLauncherOpen ? 2.5 : 2} className={isLauncherOpen ? 'text-gold-300' : 'text-gold-600'} />
            <span className="text-[10px] font-bold tracking-tight mt-0.5 whitespace-nowrap">
              Systems
            </span>
          </button>
        </div>

        {/* LEVEL 2: CONTEXT-SENSITIVE PER-SYSTEM PAGE TABS */}
        <div
          ref={scrollContainerRef}
          className={`flex-1 flex items-center gap-1 px-1.5 overflow-x-auto thin-scrollbar no-scrollbar ${
            systemPages.length <= 4 ? 'justify-around' : 'justify-start flex-nowrap'
          }`}
        >
          {systemPages.map((page) => {
            const isActive = currentPath === page.href;
            const PageIcon = pageIconMap[page.href] || FileText;

            return (
              <Link
                key={page.href}
                to={page.href}
                data-active={isActive}
                className={`group flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-95 flex-shrink-0 select-none ${
                  systemPages.length <= 4 ? 'flex-1 min-w-0' : 'min-w-[62px]'
                } ${
                  isActive
                    ? 'text-leather-900'
                    : 'text-leather-600 hover:text-leather-900'
                }`}
              >
                <div
                  className={`relative flex items-center justify-center w-9 h-6 rounded-lg transition-all ${
                    isActive
                      ? 'bg-cream-100 text-leather-800 border border-gold-400/40 font-bold scale-105 shadow-xs'
                      : 'text-leather-400 group-hover:text-leather-600'
                  }`}
                >
                  <PageIcon size={18} strokeWidth={isActive ? 2.5 : 1.9} className={isActive ? 'text-leather-800' : ''} />
                  {page.badge && (
                    <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 text-[9px] font-extrabold text-white bg-rose-500 rounded-full flex items-center justify-center shadow-xs">
                      {page.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] tracking-tight leading-tight mt-0.5 truncate max-w-[76px] ${
                    isActive ? 'font-black text-leather-900' : 'font-medium text-leather-600'
                  }`}
                >
                  {page.label}
                </span>

                {isActive && (
                  <span className="w-1.5 h-1 rounded-full bg-gold-500 mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
