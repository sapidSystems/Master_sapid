import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Send,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  AlertCircle,
  X
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  fetchProductionPlans,
  submitForApproval,
  STAGES_LIST,
  formatDate,
  getTodayDate
} from './productionService';
import { useMagicToast } from '../../context/MagicToastContext';
import { useBuyerCodes } from '../../services/buyerCodeService';

export default function ProductionPlanningNew() {
  const { showToast } = useMagicToast();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'submitted' | 'approved'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState('all');
  const { buyerCodes } = useBuyerCodes();

  // Modal for scheduling / submitting plan
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDateInput, setPlanDateInput] = useState(getTodayDate());
  const [stageDates, setStageDates] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-line plan dates buffer for quick setting
  const [inlineDates, setInlineDates] = useState({});

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchProductionPlans();
      setPlans(data);

      // Pre-fill inline dates
      const datesObj = {};
      data.forEach(p => {
        if (p.planDate) datesObj[p.id] = p.planDate;
        else datesObj[p.id] = getTodayDate();
      });
      setInlineDates(datesObj);
    } catch (err) {
      console.error('Error fetching plans:', err);
      showToast('Failed to load production plans', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter plans based on activeTab
  // 1. 'pending': draft or rejected
  // 2. 'submitted': pending_approval
  // 3. 'approved': approved
  const categorizedPlans = useMemo(() => {
    const pendingPlanning = plans.filter(
      p => !p.approvalStatus || p.approvalStatus === 'draft' || p.approvalStatus === 'rejected'
    );
    const submitted = plans.filter(p => p.approvalStatus === 'pending_approval');
    const approved = plans.filter(p => p.approvalStatus === 'approved');

    return { pendingPlanning, submitted, approved };
  }, [plans]);

  const currentTabList = useMemo(() => {
    let list = [];
    if (activeTab === 'pending') list = categorizedPlans.pendingPlanning;
    else if (activeTab === 'submitted') list = categorizedPlans.submitted;
    else if (activeTab === 'approved') list = categorizedPlans.approved;

    return list.filter(p => {
      if (selectedBuyer !== 'all' && p.buyer !== selectedBuyer) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const m1 = p.woNo && p.woNo.toLowerCase().includes(q);
        const m2 = p.buyer && p.buyer.toLowerCase().includes(q);
        const m3 = p.remarks && p.remarks.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3) return false;
      }
      return true;
    });
  }, [categorizedPlans, activeTab, selectedBuyer, searchQuery]);

  const buyerOptions = useMemo(() => {
    const set = new Set();
    buyerCodes.forEach(b => { if (b.buyerCode) set.add(b.buyerCode); });
    plans.forEach(p => { if (p.buyer) set.add(p.buyer); });
    return Array.from(set).sort();
  }, [buyerCodes, plans]);

  // Handle Quick Submit In-line
  const handleQuickSubmit = async (plan) => {
    const targetDate = inlineDates[plan.id] || plan.planDate || getTodayDate();
    if (!targetDate) {
      showToast('Please select a Plan Date first', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await submitForApproval(plan.id, targetDate);
      showToast(`Plan date saved! W/O ${plan.woNo} submitted for approval.`, 'success');

      // Update state locally
      setPlans(prev =>
        prev.map(p =>
          p.id === plan.id
            ? { ...p, planDate: targetDate, approvalStatus: 'pending_approval' }
            : p
        )
      );
    } catch (err) {
      console.error('Error submitting plan:', err);
      showToast('Failed to submit plan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Detailed Scheduling Modal
  const handleOpenScheduleModal = (plan) => {
    setSelectedPlan(plan);
    // Task 2: Master Production Plan Date field must load blank (not prefilled) — user must actively select it
    setPlanDateInput('');

    // Task 2: All Stage-by-Stage Milestone Targets must load blank — no auto-filled Planned Dates
    // The 8th milestone, "Planned Shipment", is the exception: auto-prefilled with Shipment Date from Work Order Creation and read-only
    const existingStages = plan.stages || [];
    const stagesArr = STAGES_LIST.map((name) => {
      const found = existingStages.find(s => s.name === name);
      let pDate = '';
      if (name === 'Planned Shipment') {
        pDate = plan.woDespatchDate || '';
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

  const handleSaveModalSchedule = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!planDateInput) {
      showToast('Master Production Plan Date is required. Please select a date.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      // Ensure 8th milestone "Planned Shipment" is always locked to selectedPlan.woDespatchDate
      const finalStages = stageDates.map(stg =>
        stg.name === 'Planned Shipment'
          ? { ...stg, plannedDate: selectedPlan.woDespatchDate || '' }
          : stg
      );

      await submitForApproval(selectedPlan.id, planDateInput, finalStages);
      showToast(`Production Plan submitted for approval!`, 'success');

      setPlans(prev =>
        prev.map(p =>
          p.id === selectedPlan.id
            ? {
                ...p,
                planDate: planDateInput,
                approvalStatus: 'pending_approval',
                stages: finalStages
              }
            : p
        )
      );
      setIsScheduleModalOpen(false);
    } catch (err) {
      console.error('Error submitting plan from modal:', err);
      showToast('Failed to submit plan', 'error');
    } finally {
      setIsSubmitting(false);
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
                <span className="text-brand-600">Module 3 of 5</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
                Production Planning & Scheduling
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Receive data from Work Order Creation, assign plan dates, schedule milestones, and submit for approval.
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
          {/* Search & Buyer Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by W/O No, Buyer Code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-brand-500 rounded-xl outline-hidden transition-all"
                />
              </div>

              <select
                value={selectedBuyer}
                onChange={(e) => setSelectedBuyer(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-slate-700 font-medium"
              >
                <option value="all">All Buyers ({buyerOptions.length})</option>
                {buyerOptions.map(b => {
                  const matched = buyerCodes.find(bc => bc.buyerCode === b);
                  return (
                    <option key={b} value={b}>
                      {b}{matched?.buyerName ? ` — ${matched.buyerName}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong>{currentTabList.length}</strong> work orders
            </div>
          </div>

          {/* Work Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    {activeTab === 'pending' && <th className="px-4 py-3.5 text-center">Action</th>}
                    <th className="px-4 py-3.5">W/O No</th>
                    <th className="px-4 py-3.5">Buyer</th>
                    <th className="px-4 py-3.5">W/O Date</th>
                    <th className="px-4 py-3.5">Shipment Date</th>
                    <th className="px-4 py-3.5 text-right">Quantity</th>
                    <th className="px-4 py-3.5">Current Stage</th>
                    <th className="px-4 py-3.5">Plan Date</th>
                    {activeTab === 'submitted' && <th className="px-4 py-3.5">Submitted Status</th>}
                    {activeTab === 'approved' && <th className="px-4 py-3.5">Approval Details</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {currentTabList.map((plan) => {
                    const isRejected = plan.approvalStatus === 'rejected';

                    return (
                      <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Action Column */}
                        {activeTab === 'pending' && (
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenScheduleModal(plan)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-black hover:bg-slate-900 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Sliders className="w-3.5 h-3.5 text-white" />
                              <span>Planning</span>
                            </button>
                          </td>
                        )}

                        <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                          {plan.woNo}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-slate-700 text-[11px]">
                            {plan.buyer || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(plan.woDate)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(plan.woDespatchDate)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {Number(plan.qty || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {plan.stages?.find(s => Boolean(s.actualDate))?.name || '1. HANDOVER'}
                          </span>
                        </td>

                        {/* Plan Date Column */}
                        <td className="px-4 py-3">
                          {activeTab === 'pending' ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="date"
                                value={inlineDates[plan.id] || ''}
                                onChange={(e) =>
                                  setInlineDates(prev => ({ ...prev, [plan.id]: e.target.value }))
                                }
                                className="px-2 py-1 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-black font-medium"
                              />
                            </div>
                          ) : (
                            <span className="font-bold text-slate-900 font-mono">
                              {formatDate(plan.planDate)}
                            </span>
                          )}
                        </td>

                        {/* Submitted Tab Column */}
                        {activeTab === 'submitted' && (
                          <td className="px-4 py-3">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>In Approval Queue</span>
                            </div>
                          </td>
                        )}

                        {/* Approved Tab Column */}
                        {activeTab === 'approved' && (
                          <td className="px-4 py-3">
                            <div className="text-xs">
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Approved by {plan.approvedBy || 'Admin'}</span>
                              </span>
                              {plan.approvedAt && (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(plan.approvedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {currentTabList.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                        {activeTab === 'pending' && 'No work orders currently awaiting planning.'}
                        {activeTab === 'submitted' && 'No work orders currently in the approval queue.'}
                        {activeTab === 'approved' && 'No approved work orders found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Schedule Stages Modal */}
        {isScheduleModalOpen && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
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
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveModalSchedule} className="space-y-4">
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
                    Please select the official planned production kickoff date.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Stage-by-Stage Milestone Targets
                  </h4>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {stageDates.map((stg, idx) => {
                      const isShipmentStage = stg.name === 'Planned Shipment';

                      return (
                        <div
                          key={stg.name}
                          className="p-3 bg-slate-50/60 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span>{stg.name}</span>
                            {isShipmentStage && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100/70 text-amber-800 border border-amber-200">
                                Work Order Shipment Date • Read-only
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-[11px]">Planned Date:</span>
                            <input
                              type="date"
                              disabled={isShipmentStage}
                              readOnly={isShipmentStage}
                              value={stg.plannedDate}
                              onChange={(e) => {
                                if (isShipmentStage) return;
                                const val = e.target.value;
                                setStageDates(prev =>
                                  prev.map((s, i) => (i === idx ? { ...s, plannedDate: val } : s))
                                );
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                isShipmentStage
                                  ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed select-none font-semibold'
                                  : 'bg-white border-slate-300 text-slate-800 focus:border-black outline-hidden'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-sm font-bold bg-black hover:bg-slate-900 text-white rounded-xl shadow-md disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting...' : 'Save & Submit to Approval'}</span>
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
