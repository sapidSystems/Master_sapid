import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  Layers,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  fetchProductionPlans,
  createProductionPlan,
  updateProductionPlan,
  deleteProductionPlan,
  STAGES_LIST,
  formatDate,
  getTodayDate
} from './productionService';
import { useMagicToast } from '../../context/MagicToastContext';

export default function ProductionData() {
  const { showToast } = useMagicToast();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStagesModalOpen, setIsStagesModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    buyer: '',
    woNo: '',
    wResDate: getTodayDate(),
    woDate: getTodayDate(),
    woDespatchDate: '',
    qty: '',
    remarks: ''
  });

  const currentUser = useMemo(() => {
    return {
      name: localStorage.getItem('user-name') || 'Admin User',
      role: (localStorage.getItem('role') || 'user').toLowerCase()
    };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchProductionPlans();
      setPlans(data);
    } catch (err) {
      console.error('Error fetching production plans:', err);
      showToast('Failed to load production data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter options
  const buyerOptions = useMemo(() => {
    const set = new Set();
    plans.forEach(p => { if (p.buyer) set.add(p.buyer); });
    return Array.from(set).sort();
  }, [plans]);

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      if (selectedBuyer !== 'all' && p.buyer !== selectedBuyer) return false;
      if (selectedStatus !== 'all' && (p.approvalStatus || 'draft') !== selectedStatus) return false;
      if (selectedStage !== 'all') {
        const stageIdx = STAGES_LIST.indexOf(selectedStage);
        if (stageIdx !== -1 && p.currentStage !== stageIdx + 1) {
          const hasStage = p.stages?.some(s => s.name === selectedStage && (s.plannedDate || s.actualDate));
          if (!hasStage) return false;
        }
      }
      if (fromDate && p.woDate && p.woDate < fromDate) return false;
      if (toDate && p.woDate && p.woDate > toDate) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const m1 = p.woNo && p.woNo.toLowerCase().includes(q);
        const m2 = p.buyer && p.buyer.toLowerCase().includes(q);
        const m3 = p.remarks && p.remarks.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3) return false;
      }
      return true;
    });
  }, [plans, selectedBuyer, selectedStatus, selectedStage, fromDate, toDate, searchQuery]);

  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage) || 1;
  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPlans.slice(start, start + itemsPerPage);
  }, [filteredPlans, currentPage]);

  const handleOpenAdd = () => {
    setFormData({
      buyer: '',
      woNo: '',
      wResDate: getTodayDate(),
      woDate: getTodayDate(),
      woDespatchDate: '',
      qty: '',
      remarks: ''
    });
    setIsAddModalOpen(true);
  };

  const handleSaveNew = async (e) => {
    e.preventDefault();
    if (!formData.woNo.trim() || !formData.buyer.trim() || !formData.qty.toString().trim()) {
      showToast('Please fill required fields (W/O No, Buyer Code, Quantity)', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const newPlan = await createProductionPlan(formData, currentUser);
      setPlans(prev => [newPlan, ...prev]);
      setIsAddModalOpen(false);
      showToast('Production data added successfully!', 'success');
    } catch (err) {
      console.error('Error creating plan:', err);
      showToast('Failed to add production data', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      buyer: plan.buyer || '',
      woNo: plan.woNo || '',
      wResDate: plan.wResDate || '',
      woDate: plan.woDate || '',
      woDespatchDate: plan.woDespatchDate || '',
      qty: plan.qty || '',
      remarks: plan.remarks || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    try {
      setIsSubmitting(true);
      await updateProductionPlan(selectedPlan.id, formData);
      setPlans(prev => prev.map(p => (p.id === selectedPlan.id ? { ...p, ...formData } : p)));
      setIsEditModalOpen(false);
      showToast('Production data updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating plan:', err);
      showToast('Failed to update production data', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (plan) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPlan) return;
    try {
      setIsSubmitting(true);
      await deleteProductionPlan(selectedPlan.id);
      setPlans(prev => prev.filter(p => p.id !== selectedPlan.id));
      setIsDeleteModalOpen(false);
      showToast('Production record deleted', 'success');
    } catch (err) {
      console.error('Error deleting plan:', err);
      showToast('Failed to delete record', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenStages = (plan) => {
    setSelectedPlan(plan);
    setIsStagesModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Approved</span>
          </span>
        );
      case 'pending_approval':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pending Approval</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1">
            <span>Draft</span>
          </span>
        );
    }
  };

  const getCurrentStageName = (plan) => {
    if (plan.stages && Array.isArray(plan.stages)) {
      const lastCompleted = [...plan.stages].reverse().find(s => Boolean(s.actualDate));
      if (lastCompleted) return lastCompleted.name;
      const firstPlanned = plan.stages.find(s => Boolean(s.plannedDate));
      if (firstPlanned) return firstPlanned.name;
    }
    if (plan.currentStage > 0 && plan.currentStage <= STAGES_LIST.length) {
      return STAGES_LIST[plan.currentStage - 1];
    }
    return '1. HANDOVER';
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50/50 pb-16">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Production System</span>
                <span>•</span>
                <span className="text-brand-600">Module 2 of 4</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
                Production Data Registry
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Add and manage work order records, view lifecycle stages, and monitor progress.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={loadData}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search W/O No, Buyer, or Remarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-brand-500 rounded-xl outline-hidden transition-all"
                />
              </div>

              {/* Buyer */}
              <select
                value={selectedBuyer}
                onChange={(e) => setSelectedBuyer(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-slate-700 font-medium"
              >
                <option value="all">All Buyers ({buyerOptions.length})</option>
                {buyerOptions.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              {/* Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-slate-700 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Stage Filter */}
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-slate-700 font-medium"
              >
                <option value="all">All Stages</option>
                {STAGES_LIST.map(stg => (
                  <option key={stg} value={stg}>{stg}</option>
                ))}
              </select>
            </div>

            {/* Date Range & Reset */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <span>To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                {(searchQuery || selectedBuyer !== 'all' || selectedStatus !== 'all' || selectedStage !== 'all' || fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedBuyer('all');
                      setSelectedStatus('all');
                      setSelectedStage('all');
                      setFromDate('');
                      setToDate('');
                    }}
                    className="px-2 py-1 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              <div>
                Showing <strong>{filteredPlans.length}</strong> records
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-4 py-3.5">W/O No</th>
                    <th className="px-4 py-3.5">Buyer</th>
                    <th className="px-4 py-3.5">W/O Date</th>
                    <th className="px-4 py-3.5">Rec Date</th>
                    <th className="px-4 py-3.5">Shipment Date</th>
                    <th className="px-4 py-3.5 text-right">Quantity</th>
                    <th className="px-4 py-3.5">Current Stage</th>
                    <th className="px-4 py-3.5">Plan Date</th>
                    <th className="px-4 py-3.5">Approval Status</th>
                    <th className="px-4 py-3.5">Remarks</th>
                    <th className="px-4 py-3.5">Added By</th>
                    <th className="px-4 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedPlans.map((plan) => {
                    const currentStageName = getCurrentStageName(plan);
                    const isDraftOrRejected = !plan.approvalStatus || plan.approvalStatus === 'draft' || plan.approvalStatus === 'rejected';

                    return (
                      <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                          {plan.woNo}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-slate-700 text-[11px]">
                            {plan.buyer || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(plan.woDate)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(plan.wResDate)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(plan.woDespatchDate)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {Number(plan.qty || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-semibold inline-flex items-center gap-1">
                            <Layers className="w-3 h-3 text-blue-600" />
                            <span>{currentStageName}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {plan.planDate ? (
                            <span className="font-semibold text-brand-700">{formatDate(plan.planDate)}</span>
                          ) : (
                            <Link
                              to="/dashboard/production/planning"
                              className="text-amber-600 hover:underline font-semibold flex items-center gap-1 text-[11px]"
                            >
                              <span>Set Plan Date</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(plan.approvalStatus)}</td>
                        <td className="px-4 py-3 max-w-[180px] truncate text-slate-500" title={plan.remarks}>
                          {plan.remarks || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">{plan.addedBy || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenStages(plan)}
                              title="View Stage Timeline"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {isDraftOrRejected && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(plan)}
                                title="Edit Record"
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isDraftOrRejected && (
                              <button
                                type="button"
                                onClick={() => handleOpenDelete(plan)}
                                title="Delete Record"
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 hover:text-rose-800 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedPlans.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-4 py-12 text-center text-slate-400">
                        No production records found matching the filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredPlans.length} items)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Add New Production Work Order</h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveNew} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      W/O No <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WO-2024-001"
                      value={formData.woNo}
                      onChange={(e) => setFormData(prev => ({ ...prev, woNo: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-hidden focus:border-black font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Buyer Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BUYER-XYZ"
                      value={formData.buyer}
                      onChange={(e) => setFormData(prev => ({ ...prev, buyer: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-hidden focus:border-black font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">W/O Date</label>
                    <input
                      type="date"
                      value={formData.woDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, woDate: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Date</label>
                    <input
                      type="date"
                      value={formData.wResDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, wResDate: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shipment Date</label>
                    <input
                      type="date"
                      value={formData.woDespatchDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, woDespatchDate: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantity (Units) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 500"
                    value={formData.qty}
                    onChange={(e) => setFormData(prev => ({ ...prev, qty: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-hidden focus:border-black font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Special Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Add leather details, material specs, or special instructions..."
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-hidden focus:border-black"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-sm font-bold bg-black hover:bg-slate-900 text-white rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Edit Work Order ({selectedPlan.woNo})</h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">W/O No</label>
                    <input
                      type="text"
                      required
                      value={formData.woNo}
                      onChange={(e) => setFormData(prev => ({ ...prev, woNo: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Buyer Code</label>
                    <input
                      type="text"
                      required
                      value={formData.buyer}
                      onChange={(e) => setFormData(prev => ({ ...prev, buyer: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">W/O Date</label>
                    <input
                      type="date"
                      value={formData.woDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, woDate: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Date</label>
                    <input
                      type="date"
                      value={formData.wResDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, wResDate: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shipment Date</label>
                    <input
                      type="date"
                      value={formData.woDespatchDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, woDespatchDate: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={formData.qty}
                    onChange={(e) => setFormData(prev => ({ ...prev, qty: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
                  <textarea
                    rows={3}
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-sm font-bold bg-black hover:bg-slate-900 text-white rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stage Timeline Modal */}
        {isStagesModalOpen && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Stage Progress: {selectedPlan.woNo} ({selectedPlan.buyer})
                  </h3>
                  <p className="text-xs text-slate-500">Shipment Target: {formatDate(selectedPlan.woDespatchDate)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStagesModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {STAGES_LIST.map((stageName, idx) => {
                  const stageObj = selectedPlan.stages?.find(s => s.name === stageName) || {};
                  const isDone = Boolean(stageObj.actualDate);
                  const isPlanned = Boolean(stageObj.plannedDate);

                  return (
                    <div
                      key={stageName}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isDone
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : isPlanned
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : isPlanned
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{stageName}</div>
                          {stageObj.remarks && (
                            <div className="text-xs text-slate-500 italic mt-0.5">{stageObj.remarks}</div>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        {isDone ? (
                          <div>
                            <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                              Completed: {formatDate(stageObj.actualDate)}
                            </span>
                            {stageObj.plannedDate && (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Target was: {formatDate(stageObj.plannedDate)}
                              </div>
                            )}
                          </div>
                        ) : isPlanned ? (
                          <span className="font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                            Planned: {formatDate(stageObj.plannedDate)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Awaiting Plan</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Plan Date: <strong>{formatDate(selectedPlan.planDate)}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStagesModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Production Record?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete W/O <strong>{selectedPlan.woNo}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
