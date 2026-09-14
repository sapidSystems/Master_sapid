import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  type?: 'delete' | 'complete' | 'default';
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  type = 'default',
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  isLoading = false,
  onConfirm,
  onCancel
}) => {
  // ESC key support (Req #69)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const isDelete = type === 'delete';
  const isComplete = type === 'complete';

  const defaultTitle = isDelete
    ? 'Are you sure?'
    : isComplete
    ? 'Complete this procurement?'
    : 'Confirm Action';

  const defaultMessage = isDelete
    ? 'This record will be permanently deleted from the database. This action cannot be undone.'
    : isComplete
    ? 'This record will move from Pending to History with the actual delivery receipt date recorded.'
    : 'Are you sure you want to proceed?';

  const defaultConfirmLabel = isDelete
    ? 'Delete Record'
    : isComplete
    ? 'Confirm & Move to History'
    : 'Confirm';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-0 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDelete 
                ? 'bg-rose-100 text-rose-600' 
                : 'bg-emerald-100 text-emerald-600'
            }`}>
              {isDelete ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {title || defaultTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            {message || defaultMessage}
          </p>
        </div>

        {/* Footer (Req #54 & #67) */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-soft transition-colors flex items-center justify-center gap-2 ${
              isDelete
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-400'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-400'
            }`}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                {isDelete ? 'Deleting...' : 'Confirming...'}
              </span>
            ) : (
              confirmLabel || defaultConfirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
