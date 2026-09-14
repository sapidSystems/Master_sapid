import React, { useEffect } from 'react';
import { User, Mail, Shield, Building, X, LogOut, Database } from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, logoutUser, newLeather, dailyLeather, materials, packaging } = useProcurement();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentUser) return null;

  const totalItems = newLeather.length + dailyLeather.length + materials.length + packaging.length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-brand-600 to-indigo-700 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md text-white font-black text-xl flex items-center justify-center shadow-lg border border-white/30 mb-3">
            {currentUser.avatar}
          </div>
          <h3 className="text-lg font-bold">{currentUser.name}</h3>
          <p className="text-xs text-white/80">{currentUser.role}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Mail className="w-4 h-4 text-brand-500" />
              <span>{currentUser.email}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Building className="w-4 h-4 text-brand-500" />
              <span>{currentUser.department}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Shield className="w-4 h-4 text-brand-500" />
              <span>Access Level: Administrator (Procurement MIS)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-brand-500" />
              <span>LocalStorage Persistence</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              {totalItems} total procurement orders stored securely in your browser cache.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                logoutUser();
                onClose();
              }}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Session (Data Preserved)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
