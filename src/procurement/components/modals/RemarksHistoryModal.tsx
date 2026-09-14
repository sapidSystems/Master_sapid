import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Clock, User } from 'lucide-react';
import { RemarkEntry, ModuleType } from '../../types/procurement';
import { formatDateTime } from '../../utils/dateUtils';

interface RemarksHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: ModuleType;
  recordId: string;
  recordTitle: string;
  remarks: RemarkEntry[];
  onAddRemark: (text: string) => Promise<boolean>;
}

export const RemarksHistoryModal: React.FC<RemarksHistoryModalProps> = ({
  isOpen,
  onClose,
  recordTitle,
  remarks,
  onAddRemark
}) => {
  const [newRemarkText, setNewRemarkText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemarkText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const success = await onAddRemark(newRemarkText.trim());
    setIsSubmitting(false);
    if (success) {
      setNewRemarkText('');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-[95%] sm:w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 leading-tight">
                Remarks & Audit Trail
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-sm">
                {recordTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Remarks List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 divide-y divide-slate-100">
          {remarks.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs sm:text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No remarks logged yet. Add the first remark below.
            </div>
          ) : (
            remarks.map((rem, idx) => (
              <div key={rem.id || idx} className={`${idx > 0 ? 'pt-3' : ''} space-y-1.5`}>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-500" />
                    {rem.author}
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(rem.timestamp)}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                  {rem.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* New Remark Input Form */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100">
          <label htmlFor="modal-new-remark" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Add New Remark
          </label>
          <div className="flex gap-2">
            <textarea
              id="modal-new-remark"
              rows={2}
              value={newRemarkText}
              onChange={(e) => setNewRemarkText(e.target.value)}
              placeholder="Type procurement update, tannery status, or dispatch note..."
              className="flex-1 p-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
            />
            <button
              type="submit"
              disabled={!newRemarkText.trim() || isSubmitting}
              className="self-end min-h-[44px] px-3.5 sm:px-4 py-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 shadow-soft"
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin">⌛</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
