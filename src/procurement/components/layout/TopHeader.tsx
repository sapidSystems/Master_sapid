import React, { useState } from 'react';
import { Menu, Sun, Moon, Bell, User, LogOut, Activity, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useProcurement } from '../../context/ProcurementContext';

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenProfile: () => void;
  onOpenActivityLog: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenMobileMenu,
  onOpenProfile,
  onOpenActivityLog
}) => {
  const { theme, toggleTheme } = useTheme();
  const { activeNav, activeTab, currentUser, logoutUser, loginUser } = useProcurement();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Friendly title
  const navTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    'new-leather': 'New Leather Development',
    'daily-leather': 'Daily Leather Procurement',
    material: 'Daily Material Procurement',
    packaging: 'Daily Packaging Procurement',
    activity: 'System Activity Logs'
  };

  const currentTitle = navTitles[activeNav] || 'Procurement Management';

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 transition-colors">
      <div className="px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Hamburger & Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Hamburger Button (Req #50 & #51) */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs & Page Title */}
          <div className="min-w-0">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <span>ERP System</span>
              <span>/</span>
              <span>Procurement MIS</span>
              {activeNav !== 'dashboard' && activeNav !== 'activity' && (
                <>
                  <span>/</span>
                  <span className="capitalize">{activeTab}</span>
                </>
              )}
            </div>
            <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate leading-tight">
              {currentTitle}
            </h1>
          </div>
        </div>

        {/* Right: Actions, Theme Toggle, Notifications, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Theme Toggle Button (Req #48: ☀️ Light / 🌙 Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all text-xs font-semibold shadow-soft-sm"
            aria-label="Toggle Light and Dark Mode"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-brand-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            )}
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors relative shadow-soft-sm"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white" />
            </button>

            {/* Notifications Popover */}
            {notificationsOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setNotificationsOpen(false)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">Procurement Alerts</span>
                  <span className="text-[11px] text-brand-600 font-medium">Live</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs py-1">
                  <div className="py-2.5">
                    <span className="font-semibold text-rose-600">Delayed Alert:</span>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      WO-88402 (Heavy Waxed Pull-up) is overdue by 6 days. Follow-up required.
                    </p>
                  </div>
                  <div className="py-2.5">
                    <span className="font-semibold text-emerald-600">Receipt Completed:</span>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      PKG-4003 (5-Ply Export Master Cartons) verified in warehouse.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Current User & Profile Dropdown (Req #71) */}
          <div className="relative">
            {currentUser ? (
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 sm:pl-2.5 sm:pr-3 py-1 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-soft-sm"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-soft">
                  {currentUser.avatar}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    {currentUser.role.split('&')[0]}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>
            ) : (
              <button
                type="button"
                onClick={loginUser}
                className="px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && currentUser && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                </div>

                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenActivityLog}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span>Audit Activity Log</span>
                </button>

                <div className="border-t border-slate-100 my-1 pt-1">
                  <button
                    type="button"
                    onClick={logoutUser}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
