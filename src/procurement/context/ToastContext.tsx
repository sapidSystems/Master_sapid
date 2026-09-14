import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    setToasts(prev => [...prev, { id, message, type, title }]);

    // Auto dismiss after 3.8 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Responsive Toast Container */}
      <div 
        role="region" 
        aria-live="polite"
        className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex flex-col gap-2 pointer-events-none max-w-md"
      >
        {toasts.map(toast => {
          const bgColors = {
            success: 'bg-white border-emerald-500/50 text-slate-800',
            error: 'bg-white border-rose-500/50 text-slate-800',
            warning: 'bg-white border-amber-500/50 text-slate-800',
            info: 'bg-white border-blue-500/50 text-slate-800',
          }[toast.type];

          const iconColors = {
            success: 'text-emerald-600',
            error: 'text-rose-600',
            warning: 'text-amber-600',
            info: 'text-blue-600',
          }[toast.type];

          const IconComponent = {
            success: CheckCircle2,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info,
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-xl shadow-lg border ${bgColors} animate-in fade-in slide-in-from-bottom-2 duration-200 transition-all`}
            >
              <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors}`} />
              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <h4 className="text-sm font-semibold mb-0.5 text-slate-900">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs sm:text-sm text-slate-700 break-words leading-relaxed">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1 -mr-1 rounded-md transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
