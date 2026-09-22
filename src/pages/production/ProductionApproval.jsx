import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Layers,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  Zap,
  Check,
  X,
  AlertTriangle,
  History,
  Sliders
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  fetchProductionPlans,
  approveProductionPlan,
  rejectProductionPlan,
  fetchApprovalHistory,
  updateProductionPlan,
  formatDate,
  getTodayDate,
  STAGES_LIST
} from './productionService';
import { useMagicToast } from '../../context/MagicToastContext';

export default function ProductionApproval() {
  const { showToast } = useMagicToast();
  const [plans, setPlans] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [searchQuery, setSearchQuery] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'approved' | 'rejected'

  // Modals
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [planDateInput, setPlanDateInput] = useState('');
  const [stageDates, setStageDates] = useState([]);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [decisionNote, setDecisionNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentUser = useMemo(() => {
    return {
      name: localStorage.getItem('user-name') || 'Approver User',
      role: (localStorage.getItem('role') || 'admin').toLowerCase()
    };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [plansData, historyData] = await Promise.all([
        fetchProductionPlans(),
        fetchApprovalHistory()
      ]);
      setPlans(plansData);
      setHistoryList(historyData);
    } catch (err) {
      console.error('Error loading approval data:', err);
      showToast('Failed to load approval records', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pending approval list
  const pendingApprovals = useMemo(() => {
    return plans.filter(p => p.approvalStatus === 'pending_approval');
  }, [plans]);

  // Filtered pending
  const filteredPending = useMemo(() => {
    return pendingApprovals.filter(p => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const m1 = p.woNo && p.woNo.toLowerCase().includes(q);
        const m2 = p.buyer && p.buyer.toLowerCase().includes(q);
        const m3 = p.remarks && p.remarks.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3) return false;
      }
      return true;
    });
  }, [pendingApprovals, searchQuery]);

  // Filtered history
  const filteredHistory = useMemo(() => {
    return historyList.filter(item => {
      if (historyFilter !== 'all' && item.action !== historyFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const noteMatch = item.note && item.note.toLowerCase().includes(q);
        const userMatch = item.acted_by && item.acted_by.toLowerCase().includes(q);
        // Also check if plan is in plans list
        const relatedPlan = plans.find(p => p.id === item.planning_id);
        const woMatch = relatedPlan?.woNo?.toLowerCase().includes(q);
        const buyerMatch = relatedPlan?.buyer?.toLowerCase().includes(q);
        if (!noteMatch && !userMatch && !woMatch && !buyerMatch) return false;
      }
      return true;
    });
  }, [historyList, historyFilter, searchQuery, plans]);

  // Handlers for Milestone Schedule & Approve Modal
  const handleOpenScheduleModal = (plan) => {
    setSelectedPlan(plan);
    const initialPlanDate = plan.planDate || getTodayDate();
    setPlanDateInput(initialPlanDate);
    setDecisionNote('');

    const existingStages = plan.stages || [];
    const stagesArr = STAGES_LIST.map((name, idx) => {
      const found = existingStages.find(s => s.name === name);
      let pDate = found?.plannedDate || '';
      if (!pDate && initialPlanDate) {
        const base = new Date(initialPlanDate);
        base.setDate(base.getDate() + (idx + 1) * 3);
        pDate = base.toISOString().split('T')[0];
      }
      return {
        name,
        plannedDate: pDate,
        actualDate: found?.actualDate || '',
        remarks: found?.remarks || ''
      };
    });
    setStageDates(stagesArr);
    setIsScheduleModalOpen(true);
  };

  const handleSaveOnly = async () => {
    if (!selectedPlan) return;
    try {
      setIsProcessing(true);
      await updateProductionPlan(selectedPlan.id, {
        planDate: planDateInput,
        stages: stageDates
      });
      showToast('Milestone changes saved successfully!', 'success');
      await loadData();
      setIsScheduleModalOpen(false);
    } catch (err) {
      console.error('Error updating plan:', err);
      showToast('Failed to update plan milestones', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmApprove = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedPlan) return;
    if (!planDateInput) {
      showToast('Master Production Plan date is required', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      await approveProductionPlan({
        lead: {
          ...selectedPlan,
          planDate: planDateInput,
          stages: stageDates
        },
        note: decisionNote,
        currentUser
      });

      showToast(
        `Approved! Created records in Daily Leather, Material, and Packaging Procurement.`,
        'success'
      );

      // Refresh data
      await loadData();
      setIsScheduleModalOpen(false);
    } catch (err) {
      console.error('Error approving plan:', err);
      showToast('Failed to approve production plan', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handlers for Reject
  const handleOpenReject = (plan) => {
    setSelectedPlan(plan);
    setDecisionNote('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!decisionNote.trim()) {
      showToast('Please provide a reason for rejection', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      await rejectProductionPlan({
        lead: selectedPlan,
        note: decisionNote,
        currentUser
      });

      showToast(`Work order returned for revision.`, 'info');

      // Refresh data
      await loadData();
      setIsRejectModalOpen(false);
    } catch (err) {
      console.error('Error rejecting plan:', err);
      showToast('Failed to reject production plan', 'error');
    } finally {
      setIsProcessing(false);
    }
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
                <span className="text-brand-600">Module 4 of 4</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
                Production Plan Approvals & Procurement Dispatch
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Authorize submitted production plans. Approvals automatically dispatch records directly to the Procurement System.
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

              <Link
                to="/dashboard/procurement"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-md transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>Open Procurement System</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          {/* Tab Switcher: Pending vs History */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pending Approvals</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === 'pending' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {pendingApprovals.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Decision History</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === 'history' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {historyList.length}
              </span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search work order, buyer, or note..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-brand-500 rounded-xl outline-hidden transition-all"
                />
              </div>

              {activeTab === 'history' && (
                <select
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-slate-700 font-medium"
                >
                  <option value="all">All Decisions</option>
                  <option value="approved">Approved Only</option>
                  <option value="rejected">Rejected Only</option>
                </select>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {activeTab === 'pending'
                ? `Showing ${filteredPending.length} pending approvals`
                : `Showing ${filteredHistory.length} logged decisions`}
            </div>
          </div>

          {/* Pending Approvals Content */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {filteredPending.length > 0 && (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-600 text-white">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">
                        Automatic 3-Way Procurement Pipeline
                      </h4>
                      <p className="text-xs text-emerald-700">
                        Approving any plan immediately generates linked procurement orders in <strong>Daily Leather</strong>, <strong>Daily Material</strong>, and <strong>Daily Packaging</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-4 py-3.5">W/O No</th>
                        <th className="px-4 py-3.5">Buyer</th>
                        <th className="px-4 py-3.5">Plan Date</th>
                        <th className="px-4 py-3.5">W/O Date</th>
                        <th className="px-4 py-3.5">Shipment Date</th>
                        <th className="px-4 py-3.5 text-right">Quantity</th>
                        <th className="px-4 py-3.5">Remarks</th>
                        <th className="px-4 py-3.5">Submitted By</th>
                        <th className="px-4 py-3.5 text-center">Decisions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredPending.map((plan) => (
                        <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                            {plan.woNo}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-slate-700 text-[11px]">
                              {plan.buyer || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                              {formatDate(plan.planDate)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(plan.woDate)}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(plan.woDespatchDate)}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                            {Number(plan.qty || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 max-w-[200px] truncate text-slate-500" title={plan.remarks}>
                            {plan.remarks || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-[11px]">{plan.addedBy || '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenScheduleModal(plan)}
                                className="px-3 py-1.5 bg-black hover:bg-slate-900 active:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Sliders className="w-3.5 h-3.5 text-white" />
                                <span>Update</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenReject(plan)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredPending.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <CheckCircle2 className="w-8 h-8 text-slate-300" />
                              <span className="font-semibold text-slate-600">All caught up!</span>
                              <span className="text-xs text-slate-400">No production plans currently pending approval.</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* History Content */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3.5">W/O No</th>
                      <th className="px-4 py-3.5">Buyer</th>
                      <th className="px-4 py-3.5">Decision</th>
                      <th className="px-4 py-3.5">Decision Note / Reason</th>
                      <th className="px-4 py-3.5">Decided By</th>
                      <th className="px-4 py-3.5">Date & Time</th>
                      <th className="px-4 py-3.5">Procurement Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredHistory.map((hist) => {
                      const relatedPlan = plans.find(p => p.id === hist.planning_id);
                      const isApproved = hist.action === 'approved';

                      return (
                        <tr key={hist.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                            {relatedPlan?.woNo || hist.planning_id}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-slate-700 text-[11px]">
                              {relatedPlan?.buyer || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {isApproved ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Approved</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600 italic max-w-[280px]">
                            {hist.note || 'No notes provided'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{hist.acted_by || 'Approver'}</td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                            {hist.acted_at ? new Date(hist.acted_at).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {isApproved ? (
                              <span className="text-emerald-700 text-[11px] font-bold inline-flex items-center gap-1">
                                <Zap className="w-3 h-3 text-emerald-600" />
                                <span>Pushed to 3 Modules</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Not dispatched</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredHistory.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                          No approval history records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Schedule Milestones & Approval Modal */}
        {isScheduleModalOpen && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Schedule Milestones: {selectedPlan.woNo}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Buyer: {selectedPlan.buyer} • Shipment Target: {formatDate(selectedPlan.woDespatchDate)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Master Production Plan Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={planDateInput}
                    onChange={(e) => setPlanDateInput(e.target.value)}
                    className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl outline-hidden focus:border-black font-semibold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    This date marks the official planned production kickoff date and will carry over to procurement modules upon approval.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Stage-by-Stage Milestone Targets
                  </h4>
                  <div className="space-y-2">
                    {stageDates.map((stg, idx) => (
                      <div
                        key={stg.name}
                        className="p-3 bg-slate-50/60 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{stg.name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[11px]">Planned Date:</span>
                          <input
                            type="date"
                            value={stg.plannedDate || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStageDates(prev =>
                                prev.map((s, i) => (i === idx ? { ...s, plannedDate: val } : s))
                              );
                            }}
                            className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Approval Note */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Approval Note / Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Approved for procurement kickoff..."
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl outline-hidden focus:border-black"
                  />
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 pt-1 font-medium">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Approving will automatically dispatch records to Daily Leather, Material, and Packaging Procurement.</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleSaveOnly}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleConfirmApprove}
                    className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl shadow-md disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isProcessing ? 'Approving & Dispatching...' : 'Approve'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {isRejectModalOpen && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h3 className="text-lg font-bold text-slate-900">
                    Reject Plan: {selectedPlan.woNo}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Rejecting will return this plan to <strong>Production Data</strong> in rejected status so the team can revise dates or quantities.
              </p>

              <form onSubmit={handleConfirmReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reason for Rejection <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide specific instructions on what needs to be changed (e.g. adjust plan date, verify buyer order quantity)..."
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-hidden focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRejectModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-5 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl shadow-md disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <X className="w-4 h-4 stroke-[3]" />
                    <span>{isProcessing ? 'Rejecting...' : 'Confirm Rejection'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
