import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  Users
} from 'lucide-react';
import {
  useBuyerCodes,
  createMasterBuyerCode,
  updateMasterBuyerCode,
  deleteMasterBuyerCode
} from '../../services/buyerCodeService';
import { useMagicToast } from '../../context/MagicToastContext';

export default function BuyerCodesTab() {
  const { showToast } = useMagicToast();
  const { buyerCodes, isLoading, reload } = useBuyerCodes();
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    buyerName: '',
    buyerCode: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Filtered List
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return buyerCodes;
    const q = searchQuery.toLowerCase();
    return buyerCodes.filter(b =>
      b.buyerCode.toLowerCase().includes(q) ||
      b.buyerName.toLowerCase().includes(q) ||
      (b.description && b.description.toLowerCase().includes(q))
    );
  }, [buyerCodes, searchQuery]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ buyerName: '', buyerCode: '', description: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setCurrentId(item.id);
    setFormData({
      buyerName: item.buyerName || '',
      buyerCode: item.buyerCode || '',
      description: item.description || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.buyerName.trim()) {
      setFormError('Customer / Buyer Name is required');
      return;
    }
    if (!formData.buyerCode.trim()) {
      setFormError('Buyer Code is required');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditing) {
        await updateMasterBuyerCode(currentId, formData);
        showToast('Buyer Code updated successfully!', 'success');
      } else {
        await createMasterBuyerCode(formData);
        showToast('New Buyer Code added successfully!', 'success');
      }
      setIsModalOpen(false);
      reload();
    } catch (err) {
      console.error('Error saving buyer code:', err);
      setFormError(err.message || 'Failed to save buyer code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedToDelete) return;
    try {
      setIsSubmitting(true);
      await deleteMasterBuyerCode(selectedToDelete.id);
      showToast(`Buyer Code "${selectedToDelete.buyerCode}" deleted`, 'success');
      setIsDeleting(false);
      setSelectedToDelete(null);
      reload();
    } catch (err) {
      console.error('Error deleting buyer code:', err);
      showToast('Failed to delete buyer code', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Metric Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-purple-200 border border-white/10 mb-2">
              <Tag className="w-3.5 h-3.5" />
              <span>Master Configuration</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Customer & Buyer Codes Master
            </h2>
            <p className="text-purple-200 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
              Define unique Buyer Codes mapped to Customer Names. All modules (Work Order Creation, Daily Procurement, Planning) source dynamically from this master list.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <span className="text-[11px] font-semibold text-purple-200 block uppercase">Total Buyers</span>
              <span className="text-2xl font-black text-white font-mono">{buyerCodes.length}</span>
            </div>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-5 py-3 rounded-2xl bg-white text-purple-950 hover:bg-purple-50 font-bold text-xs md:text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Buyer Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Buyer Code, Customer Name, or Notes..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm outline-none focus:bg-white focus:border-purple-600 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredList.length}</strong> of {buyerCodes.length} buyer codes
        </div>
      </div>

      {/* Buyer Codes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-5 py-3.5">Buyer Code</th>
                <th className="px-5 py-3.5">Customer / Buyer Name</th>
                <th className="px-5 py-3.5">Description / Remarks</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-purple-50/30 transition-colors group">
                  <td className="px-5 py-3.5 font-bold font-mono">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200/80">
                      {item.buyerCode}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{item.buyerName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                    {item.description || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Buyer Code"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedToDelete(item);
                          setIsDeleting(true);
                        }}
                        title="Delete Buyer Code"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No buyer codes found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try searching with a different term or add a new code.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isEditing ? 'Edit Buyer Code' : 'Add New Customer / Buyer Code'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure master buyer details for global system dropdowns
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer / Buyer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dolce & Gabbana, Inditex, Zara"
                  value={formData.buyerName}
                  onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl outline-none focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unique Buyer Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DG, IT, VL, ZARA"
                  value={formData.buyerCode}
                  onChange={(e) => setFormData({ ...formData, buyerCode: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl outline-none focus:border-purple-600 font-mono font-bold uppercase tracking-wider"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Short uppercase identifier used across Work Orders and Procurement filters.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional customer notes, division or requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl outline-none focus:border-purple-600 font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs md:text-sm font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-md disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Buyer Code'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && selectedToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Buyer Code?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete <strong>{selectedToDelete.buyerCode}</strong> ({selectedToDelete.buyerName})? Existing historical records will remain intact.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleting(false);
                  setSelectedToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
