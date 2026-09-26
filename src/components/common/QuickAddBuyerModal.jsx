import React, { useState } from 'react';
import { Tag, Plus, X, AlertCircle, Check } from 'lucide-react';
import { createMasterBuyerCode } from '../../services/buyerCodeService';
import { useMagicToast } from '../../context/MagicToastContext';

export default function QuickAddBuyerModal({ isOpen, onClose, onCreated, initialCode = '' }) {
  const { showToast } = useMagicToast();
  const [buyerCode, setBuyerCode] = useState(initialCode);
  const [buyerName, setBuyerName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const cleanCode = buyerCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Please enter a Buyer Code');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const created = await createMasterBuyerCode({
        buyerCode: cleanCode,
        buyerName: buyerName.trim() || cleanCode,
        description: description.trim()
      });

      showToast?.(`Buyer Code "${created.buyerCode}" added to master list`, 'success');
      onCreated?.(created.buyerCode, created);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create Buyer Code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add New Buyer Code</h3>
              <p className="text-[11px] text-slate-500">Saves to master list across all modules</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Buyer Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="e.g. PRADA or BUY-01"
              value={buyerCode}
              onChange={(e) => {
                setBuyerCode(e.target.value.toUpperCase());
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Unique short identifier for the customer</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer / Buyer Name
            </label>
            <input
              type="text"
              placeholder="e.g. Prada Group (optional)"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Defaults to the Buyer Code if left empty</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Italian luxury fashion house (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !buyerCode.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <span>Adding...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save to Master List</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
