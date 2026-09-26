import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Pencil,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  MessageSquare,
  Lock
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  fetchProductionPlans,
  updateProductionPlan,
  formatDate,
  getTodayDate,
  STAGES_LIST,
  extractRemarkRecords,
  getProcurementModuleConfig,
  fetchProcurementDataForOrders,
  fetchProcurementForSinglePlan,
  mergeProcurementIntoStages
} from './productionService';
import { useBuyerCodes } from '../../services/buyerCodeService';
import { useMagicToast } from '../../context/MagicToastContext';

// Helper to compute time delay string
export const calculateTimeDelay = (plannedDate, actualDate) => {
  if (!plannedDate || !actualDate) return '-';
  try {
    const p = new Date(plannedDate);
    const a = new Date(actualDate);
    if (isNaN(p.getTime()) || isNaN(a.getTime())) return '-';
    // Normalize to UTC midnight to avoid DST/tz issues
    const utc1 = Date.UTC(p.getFullYear(), p.getMonth(), p.getDate());
    const utc2 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const diffDays = Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'On time';
    if (diffDays > 0) return `${diffDays} day${diffDays === 1 ? '' : 's'} delay`;
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} early`;
  } catch {
    return '-';
  }
};

export default function ProductionMonitoring() {
  const { showToast } = useMagicToast();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [historySubTab, setHistorySubTab] = useState('remarks'); // 'remarks' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState('all');
  const { buyerCodes } = useBuyerCodes();
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'delayed' | 'ontime'

  // Update Modal State
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [modalStages, setModalStages] = useState([]);
  const [modalDespatchDate, setModalDespatchDate] = useState('');
  const [modalRemarks, setModalRemarks] = useState('');
  const [isEditingDespatch, setIsEditingDespatch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchProductionPlans();
      // Fetch procurement information across daily leather, material, and packaging
      const procLookup = await fetchProcurementDataForOrders(data);
      // Merge procurement actual dates and latest remarks into each plan
      const mergedPlans = data.map(plan => {
        const procInfo = procLookup.getInfoForPlan(plan);
        const mergedStages = mergeProcurementIntoStages(plan.stages || [], procInfo);
        return {
          ...plan,
          stages: mergedStages,
          _procurementInfo: procInfo
        };
      });
      setPlans(mergedPlans);
    } catch (err) {
      console.error('Error fetching production plans:', err);
      showToast('Failed to load production monitoring records', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Approved plans only
  const approvedPlans = useMemo(() => {
    return plans.filter(p => p.approvalStatus === 'approved');
  }, [plans]);

  // Separate Active Orders from Completed History
  const activePlans = useMemo(() => {
    return approvedPlans.filter(p => !p.isHistory);
  }, [approvedPlans]);

  const historyPlans = useMemo(() => {
    return approvedPlans.filter(p => !!p.isHistory);
  }, [approvedPlans]);

  // Extract all discrete remark records across approved plans
  const allRemarkRecords = useMemo(() => {
    return extractRemarkRecords(approvedPlans);
  }, [approvedPlans]);

  // Filtered remark records for History -> Remarks view
  const filteredRemarkRecords = useMemo(() => {
    return allRemarkRecords.filter(r => {
      if (selectedBuyer !== 'all' && r.buyer !== selectedBuyer) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchWo = r.woNo && r.woNo.toLowerCase().includes(q);
        const matchBuyer = r.buyer && r.buyer.toLowerCase().includes(q);
        const matchRemark = r.remark && r.remark.toLowerCase().includes(q);
        const matchStage = r.stageName && r.stageName.toLowerCase().includes(q);
        if (!matchWo && !matchBuyer && !matchRemark && !matchStage) return false;
      }
      return true;
    });
  }, [allRemarkRecords, selectedBuyer, searchQuery]);

  // Active tab selection
  const currentTabPlans = useMemo(() => {
    return activeTab === 'history' ? historyPlans : activePlans;
  }, [activeTab, activePlans, historyPlans]);

  // Unique buyer list from master Buyer Codes + approved plans
  const buyersList = useMemo(() => {
    const set = new Set();
    buyerCodes.forEach(b => {
      if (b.buyerCode) set.add(b.buyerCode);
    });
    approvedPlans.forEach(p => {
      if (p.buyer) set.add(p.buyer);
    });
    return Array.from(set).sort();
  }, [buyerCodes, approvedPlans]);

  // Overall delay status helper for a plan
  const getPlanDelaySummary = (plan) => {
    const stages = plan.stages || [];
    let maxDelay = 0;
    let hasActual = false;

    stages.forEach(stg => {
      if (stg.plannedDate && stg.actualDate) {
        hasActual = true;
        const p = new Date(stg.plannedDate);
        const a = new Date(stg.actualDate);
        const diff = Math.round((a.getTime() - p.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > maxDelay) maxDelay = diff;
      }
    });

    if (!hasActual) return { label: 'Scheduled', type: 'scheduled', maxDelay: 0 };
    if (maxDelay > 0) return { label: `${maxDelay}d Delay`, type: 'delayed', maxDelay };
    return { label: 'On Time', type: 'ontime', maxDelay: 0 };
  };

  // Filtered plans based on activeTab, buyer, status, and search
  const filteredPlans = useMemo(() => {
    return currentTabPlans.filter(p => {
      if (selectedBuyer !== 'all' && p.buyer !== selectedBuyer) return false;

      const summary = getPlanDelaySummary(p);
      if (statusFilter === 'delayed' && summary.type !== 'delayed') return false;
      if (statusFilter === 'ontime' && summary.type !== 'ontime') return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const m1 = p.woNo && p.woNo.toLowerCase().includes(q);
        const m2 = p.buyer && p.buyer.toLowerCase().includes(q);
        const m3 = p.remarks && p.remarks.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3) return false;
      }
      return true;
    });
  }, [currentTabPlans, selectedBuyer, statusFilter, searchQuery]);

  // KPI Metrics
  const kpis = useMemo(() => {
    const totalApproved = approvedPlans.length;
    const activeCount = activePlans.length;
    const historyCount = historyPlans.length;

    let delayedActive = 0;
    let ontimeActive = 0;
    let scheduledActive = 0;
    let activeQty = 0;

    activePlans.forEach(p => {
      activeQty += Number(p.qty) || 0;
      const s = getPlanDelaySummary(p);
      if (s.type === 'delayed') delayedActive++;
      else if (s.type === 'ontime') ontimeActive++;
      else scheduledActive++;
    });

    return {
      totalApproved,
      activeCount,
      historyCount,
      delayedActive,
      ontimeActive,
      scheduledActive,
      activeQty
    };
  }, [approvedPlans, activePlans, historyPlans]);

  // Open Update Modal
  const handleOpenUpdate = async (plan) => {
    setSelectedPlan(plan);
    setModalDespatchDate(plan.woDespatchDate || '');
    setModalRemarks(plan.remarks || '');
    setIsEditingDespatch(false);

    let procInfo = plan._procurementInfo;
    const existingStages = plan.stages || [];
    const buildStagesArr = (info) => {
      return STAGES_LIST.map((name) => {
        const found = existingStages.find(s => s.name === name);
        const procCfg = getProcurementModuleConfig(name);
        const isProcLocked = Boolean(procCfg);
        const modData = (isProcLocked && info) ? info[procCfg.module] : null;

        const actualDate = (isProcLocked && modData?.actualDate)
          ? modData.actualDate
          : (found?.actualDate || '');

        const remarks = (isProcLocked && modData?.remark)
          ? modData.remark
          : (found?.remarks || '');

        const remarkDate = (isProcLocked && modData?.remarkDate)
          ? modData.remarkDate
          : (found?.remarkDate || '');

        const remarkAuthor = (isProcLocked && modData?.remarkAuthor)
          ? modData.remarkAuthor
          : (found?.remarkAuthor || '');

        return {
          name,
          plannedDate: found?.plannedDate || '',
          actualDate,
          remarks,
          remarkDate,
          remarkAuthor,
          woRemarkDate: found?.woRemarkDate || '',
          woRemarkAuthor: found?.woRemarkAuthor || '',
          isProcurementLocked: isProcLocked,
          procurementConfig: procCfg
        };
      });
    };

    setModalStages(buildStagesArr(procInfo));
    setIsUpdateModalOpen(true);

    // Refresh procurement data asynchronously for this plan to ensure freshness
    try {
      const freshInfo = await fetchProcurementForSinglePlan(plan);
      if (freshInfo) {
        setModalStages(buildStagesArr(freshInfo));
      }
    } catch (fetchErr) {
      console.warn('Could not refresh single plan procurement data:', fetchErr);
    }
  };

  // Handle stage field changes in modal (prevent editing procurement locked fields)
  const handleStageChange = (idx, field, value) => {
    setModalStages(prev =>
      prev.map((item, i) => {
        if (i === idx && item.isProcurementLocked && (field === 'actualDate' || field === 'remarks' || field === 'plannedDate')) {
          return item;
        }
        return i === idx ? { ...item, [field]: value } : item;
      })
    );
  };

  // Check if all milestone stages in modal are completed with planned & actual dates
  const modalCompletedStagesCount = useMemo(() => {
    return modalStages.filter(
      s => Boolean(s.plannedDate && String(s.plannedDate).trim() && s.actualDate && String(s.actualDate).trim())
    ).length;
  }, [modalStages]);

  const isModalAllStagesComplete = useMemo(() => {
    return modalStages.length >= STAGES_LIST.length &&
      modalStages.every(stage =>
        Boolean(stage.plannedDate && String(stage.plannedDate).trim()) &&
        Boolean(stage.actualDate && String(stage.actualDate).trim())
      );
  }, [modalStages]);

  // Save Modal Updates
  const handleSaveUpdate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedPlan) return;

    try {
      setIsSaving(true);
      const currentUserName =
        localStorage.getItem('user-name') ||
        localStorage.getItem('name') ||
        'Production Supervisor';
      const nowIso = new Date().toISOString();

      // Check if overall remarks changed or newly added
      const existingFirstStage = (selectedPlan.stages || [])[0];
      let updatedWoRemarkDate = existingFirstStage?.woRemarkDate || null;
      let updatedWoRemarkAuthor = existingFirstStage?.woRemarkAuthor || null;

      if (modalRemarks && modalRemarks.trim()) {
        const hasOverallChanged = !selectedPlan.remarks || selectedPlan.remarks.trim() !== modalRemarks.trim();
        if (hasOverallChanged || !updatedWoRemarkDate) {
          updatedWoRemarkDate = nowIso;
          updatedWoRemarkAuthor = currentUserName;
        }
      }

      // Check stage-level remarks changes and attach date/author
      const updatedStages = modalStages.map((stage, idx) => {
        const prevStage = (selectedPlan.stages || []).find(s => s.name === stage.name);
        const remarkChanged = stage.remarks && stage.remarks.trim() &&
          (!prevStage?.remarks || prevStage.remarks.trim() !== stage.remarks.trim());

        return {
          ...stage,
          woRemarkDate: idx === 0 ? updatedWoRemarkDate : stage.woRemarkDate,
          woRemarkAuthor: idx === 0 ? updatedWoRemarkAuthor : stage.woRemarkAuthor,
          remarkDate: remarkChanged
            ? nowIso
            : (stage.remarkDate || prevStage?.remarkDate || (stage.remarks ? nowIso : null)),
          remarkAuthor: remarkChanged
            ? currentUserName
            : (stage.remarkAuthor || prevStage?.remarkAuthor || (stage.remarks ? currentUserName : null))
        };
      });

      // Condition: ONLY when all data fields (planned and actual dates for all 8 stages) are completed does it move to history
      const allStagesComplete = updatedStages.length >= STAGES_LIST.length &&
        updatedStages.every(stage =>
          Boolean(stage.plannedDate && String(stage.plannedDate).trim()) &&
          Boolean(stage.actualDate && String(stage.actualDate).trim())
        );

      const willMoveToHistory = allStagesComplete;

      await updateProductionPlan(selectedPlan.id, {
        stages: updatedStages,
        remarks: modalRemarks || null,
        isHistory: willMoveToHistory,
        historyTimestamp: willMoveToHistory
          ? (selectedPlan.historyTimestamp || nowIso)
          : null
      });

      if (willMoveToHistory && !selectedPlan.isHistory) {
        showToast(`All stage milestones completed! Work order ${selectedPlan.woNo} moved to History.`, 'success');
      } else if (!willMoveToHistory && selectedPlan.isHistory) {
        showToast(`Work order ${selectedPlan.woNo} reopened and moved back to Active.`, 'success');
      } else {
        showToast(`Work order ${selectedPlan.woNo} updated successfully!`, 'success');
      }

      await loadData();
      setIsUpdateModalOpen(false);
    } catch (err) {
      console.error('Error saving stage update:', err);
      showToast('Failed to save update', 'error');
    } finally {
      setIsSaving(false);
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
                <span className="text-brand-600">Module 5 of 5</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
                Production & Monitoring
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Monitor approved work orders, track actual stage completions, and log timeline delays.
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
                to="/dashboard/production/approval"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-xs transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>View Approvals</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setActiveTab('active')}
              className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-sm'
                  : 'border-slate-200 shadow-xs hover:border-slate-300'
              } flex items-center gap-3.5`}
            >
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Orders</p>
                <h3 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{kpis.activeCount}</h3>
                <p className="text-[11px] text-slate-500">{kpis.activeQty.toLocaleString()} Total Units</p>
              </div>
            </div>

            <div
              onClick={() => {
                setActiveTab('history');
                setHistorySubTab('remarks');
              }}
              className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'history' && historySubTab === 'remarks'
                  ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-sm'
                  : 'border-slate-200 shadow-xs hover:border-slate-300'
              } flex items-center gap-3.5`}
            >
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remark Records</p>
                <h3 className="text-2xl font-black text-purple-700 font-mono mt-0.5">{allRemarkRecords.length}</h3>
                <p className="text-[11px] text-slate-500">Logged across all milestones</p>
              </div>
            </div>

            <div
              onClick={() => {
                setActiveTab('history');
                setHistorySubTab('completed');
              }}
              className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'history' && historySubTab === 'completed'
                  ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-sm'
                  : 'border-slate-200 shadow-xs hover:border-slate-300'
              } flex items-center gap-3.5`}
            >
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed History</p>
                <h3 className="text-2xl font-black text-emerald-700 font-mono mt-0.5">{kpis.historyCount}</h3>
                <p className="text-[11px] text-slate-500">Fully completed orders</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delayed Stages</p>
                <h3 className="text-2xl font-black text-amber-700 font-mono mt-0.5">{kpis.delayedActive}</h3>
                <p className="text-[11px] text-slate-500">Active orders needing action</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation: Active Orders vs History */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                  activeTab === 'active'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>Active Orders</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    activeTab === 'active'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {activePlans.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>History</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    activeTab === 'history'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {allRemarkRecords.length + historyPlans.length}
                </span>
              </button>
            </div>

            {/* Sub-Tabs when in History: Remark Records vs Completed Work Orders */}
            {activeTab === 'history' && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setHistorySubTab('remarks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    historySubTab === 'remarks'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Remark Records</span>
                  <span className="px-2 py-0.2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-mono font-bold">
                    {allRemarkRecords.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setHistorySubTab('completed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    historySubTab === 'completed'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Completed Work Orders</span>
                  <span className="px-2 py-0.2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-mono font-bold">
                    {historyPlans.length}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'history' && historySubTab === 'remarks'
                      ? 'Search remark records by work order, buyer, section, remark note...'
                      : activeTab === 'history'
                      ? 'Search completed history by work order, buyer, remarks...'
                      : 'Search active orders by work order, buyer, remarks...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-hidden transition-all"
                />
              </div>

              <select
                value={selectedBuyer}
                onChange={(e) => setSelectedBuyer(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-slate-700 font-medium"
              >
                <option value="all">All Buyers</option>
                {buyersList.map(b => {
                  const matched = buyerCodes.find(bc => bc.buyerCode === b);
                  return (
                    <option key={b} value={b}>
                      {b}{matched?.buyerName ? ` — ${matched.buyerName}` : ''}
                    </option>
                  );
                })}
              </select>

              {!(activeTab === 'history' && historySubTab === 'remarks') && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-slate-700 font-medium"
                >
                  <option value="all">All Progress Statuses</option>
                  <option value="ontime">On Time</option>
                  <option value="delayed">Delayed Only</option>
                </select>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {activeTab === 'history' && historySubTab === 'remarks' ? (
                <span>Showing {filteredRemarkRecords.length} remark record{filteredRemarkRecords.length === 1 ? '' : 's'}</span>
              ) : (
                <span>Showing {filteredPlans.length} {activeTab === 'history' ? 'completed' : 'active'} work order{filteredPlans.length === 1 ? '' : 's'}</span>
              )}
            </div>
          </div>

          {/* Table Area: Switch between Remark Records and Work Orders */}
          {activeTab === 'history' && historySubTab === 'remarks' ? (
            /* Remark Records Table */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3.5">W/O No</th>
                      <th className="px-4 py-3.5">Buyer</th>
                      <th className="px-4 py-3.5">Milestone / Section</th>
                      <th className="px-4 py-3.5">Remark Note</th>
                      <th className="px-4 py-3.5">Date Logged</th>
                      <th className="px-4 py-3.5">Logged By</th>
                      <th className="px-4 py-3.5 text-center">Order Status</th>
                      <th className="px-4 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredRemarkRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 font-mono">
                          {record.woNo}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-slate-700 text-[11px]">
                            {record.buyer || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 ${
                            record.type === 'overall'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {record.type === 'overall' ? (
                              <FileSpreadsheet className="w-3 h-3 text-purple-500" />
                            ) : (
                              <Layers className="w-3 h-3 text-indigo-500" />
                            )}
                            <span>{record.sourceName}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 max-w-[340px]">
                          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-800 text-xs">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                              <span className="italic leading-relaxed font-normal">"{record.remark}"</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-medium">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                            <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold uppercase">
                              {(record.author || 'U').charAt(0)}
                            </div>
                            <span>{record.author || 'Supervisor'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {record.isHistory ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenUpdate(record.plan)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-all"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>View / Update</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredRemarkRecords.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <MessageSquare className="w-8 h-8 text-slate-300" />
                            <span className="font-semibold text-slate-600">No remark records logged yet</span>
                            <span className="text-xs text-slate-400 max-w-md">
                              When a remark is added anywhere in the update form of Production & Monitoring, a record will automatically show here and on the Report page.
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Work Orders Table (Active or Completed) */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3.5">W/O No</th>
                      <th className="px-4 py-3.5">Buyer</th>
                      <th className="px-4 py-3.5">Plan Date</th>
                      <th className="px-4 py-3.5">W/O Date</th>
                      <th className="px-4 py-3.5">Shipment Target</th>
                      <th className="px-4 py-3.5 text-right">Quantity</th>
                      <th className="px-4 py-3.5">Progress / Status</th>
                      <th className="px-4 py-3.5">Remarks</th>
                      <th className="px-4 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredPlans.map((plan) => {
                      const delayInfo = getPlanDelaySummary(plan);
                      const stagesWithActual = (plan.stages || []).filter(s => s.actualDate).length;

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
                          <td className="px-4 py-3">
                            {activeTab === 'history' ? (
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Completed</span>
                                  </span>
                                  {delayInfo.type === 'delayed' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold">
                                      {delayInfo.label}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                                      On Time
                                    </span>
                                  )}
                                </div>
                                {plan.historyTimestamp && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Finished {formatDate(plan.historyTimestamp)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {delayInfo.type === 'delayed' && (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    <span>{delayInfo.label}</span>
                                  </span>
                                )}
                                {delayInfo.type === 'ontime' && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>On Time</span>
                                  </span>
                                )}
                                {delayInfo.type === 'scheduled' && (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                                    Scheduled
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({stagesWithActual}/8)
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-[180px] truncate text-slate-500" title={plan.remarks}>
                            {plan.remarks || '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenUpdate(plan)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer text-white ${
                                activeTab === 'history'
                                  ? 'bg-slate-800 hover:bg-slate-900 active:bg-slate-950'
                                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                              }`}
                            >
                              <Sliders className="w-3.5 h-3.5 text-white" />
                              <span>{activeTab === 'history' ? 'View / Edit' : 'Update'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredPlans.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            {activeTab === 'history' ? (
                              <>
                                <Clock className="w-8 h-8 text-slate-300" />
                                <span className="font-semibold text-slate-600">No completed orders in history</span>
                                <span className="text-xs text-slate-400 max-w-md">
                                  When all stage milestones (planned and actual dates) of an update form are completed, the work order will automatically move here.
                                </span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-8 h-8 text-slate-300" />
                                <span className="font-semibold text-slate-600">No active work orders found</span>
                                <span className="text-xs text-slate-400">
                                  Approved work orders from the Approval page will appear here for stage monitoring.
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Update Form Modal - Matching Reference Image */}
        {isUpdateModalOpen && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] flex flex-col my-auto border border-slate-100">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-1 shrink-0">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#1E293B]">
                    Update - {selectedPlan.woNo}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedPlan.isHistory
                      ? 'This work order is in Completed History. You can view or adjust stage details.'
                      : 'Record actual stage dates and remarks. Order will move to History only when all stages are complete.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Completion Status Alert */}
              {isModalAllStagesComplete ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 shrink-0">
                  <div className="flex items-center gap-2.5 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>All 8 stage milestones are complete with planned & actual dates!</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider shrink-0">
                    Will Move to History
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs text-indigo-900 shrink-0">
                  <div className="flex items-center gap-2 font-medium">
                    <Activity className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Milestone Progress: <strong>{modalCompletedStagesCount} of {STAGES_LIST.length}</strong> stages have actual dates filled</span>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md font-bold text-[11px] shrink-0">
                    Remains in Active
                  </span>
                </div>
              )}

              {/* Scrollable Container */}
              <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                
                {/* Bulk Order Details Card */}
                <div className="bg-[#FAFBFD] rounded-2xl border border-slate-200/90 p-5 space-y-3.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    BULK ORDER DETAILS
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-y-3 gap-x-4">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase">W/O NO</div>
                      <div className="text-base font-bold text-indigo-600 font-mono mt-0.5">
                        {selectedPlan.woNo}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase">BUYER CODE</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {selectedPlan.buyer || '-'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase">QUANTITY</div>
                      <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                        {Number(selectedPlan.qty || 0).toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase">W/O RECEIVED DATE</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {formatDate(selectedPlan.wResDate)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase">W/O DATE</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {formatDate(selectedPlan.woDate)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-6">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase">W/O SHIPMENT</span>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {formatDate(selectedPlan?.woDespatchDate) || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Editable W/O Remarks */}
                  <div className="pt-2 border-t border-slate-200/60 mt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        W/O REMARKS / PRODUCTION NOTES
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (Add update remark or notes)
                      </span>
                    </div>
                    <input
                      type="text"
                      value={modalRemarks}
                      onChange={(e) => setModalRemarks(e.target.value)}
                      placeholder="Add overall production remarks or notes..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 focus:border-indigo-500 rounded-xl outline-hidden text-slate-800 font-medium transition-all"
                    />
                  </div>
                </div>

                {/* Stages Table */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="px-4 py-3 min-w-[200px]">Stage Name</th>
                          <th className="px-3 py-3 min-w-[140px]">Planned Date</th>
                          <th className="px-3 py-3 min-w-[140px]">Actual Date</th>
                          <th className="px-3 py-3 min-w-[110px]">Time Delay</th>
                          <th className="px-4 py-3 min-w-[180px]">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {modalStages.map((stage, idx) => {
                          const delayText = calculateTimeDelay(stage.plannedDate, stage.actualDate);
                          const isDelay = delayText.includes('delay');
                          const isOnTime = delayText === 'On time';
                          const procCfg = stage.procurementConfig || getProcurementModuleConfig(stage.name);
                          const isProcLocked = Boolean(procCfg);

                          return (
                            <tr
                              key={stage.name}
                              className={isProcLocked ? "bg-slate-50/70 hover:bg-slate-50 transition-colors" : "hover:bg-slate-50/50 transition-colors"}
                            >
                              {/* Stage Name */}
                              <td className="px-4 py-3 font-bold text-slate-800 uppercase tracking-tight">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>{stage.name}</span>
                                    {isProcLocked && (
                                      <span
                                        className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1"
                                        title={`Actual Date & Remarks are synced from ${procCfg.label} and cannot be edited manually`}
                                      >
                                        <Lock className="w-2.5 h-2.5 text-indigo-600" />
                                        <span>Procurement</span>
                                      </span>
                                    )}
                                  </div>
                                  {isProcLocked && (
                                    <span className="text-[10px] text-slate-400 font-medium normal-case">
                                      Source: <span className="text-slate-600 font-semibold">{procCfg.label}</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Planned Date */}
                              <td className="px-3 py-3">
                                <input
                                  type="date"
                                  disabled={isProcLocked}
                                  value={stage.plannedDate || ''}
                                  onChange={(e) => handleStageChange(idx, 'plannedDate', e.target.value)}
                                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium outline-hidden transition-all ${
                                    isProcLocked
                                      ? 'bg-slate-100/90 text-slate-600 border border-slate-200 cursor-not-allowed'
                                      : 'bg-white border border-slate-300 text-slate-700 focus:border-indigo-500'
                                  }`}
                                  title={isProcLocked ? "Planned date is fixed by planning schedule" : undefined}
                                />
                              </td>

                              {/* Actual Date */}
                              <td className="px-3 py-3">
                                <div>
                                  <input
                                    type="date"
                                    disabled={isProcLocked}
                                    value={stage.actualDate || ''}
                                    onChange={(e) => handleStageChange(idx, 'actualDate', e.target.value)}
                                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium outline-hidden transition-all ${
                                      isProcLocked
                                        ? 'bg-slate-100/90 text-slate-800 border border-slate-200 cursor-not-allowed font-semibold'
                                        : 'bg-white border border-slate-300 text-slate-700 focus:border-indigo-500'
                                    }`}
                                    title={
                                      isProcLocked
                                        ? stage.actualDate
                                          ? `Actual Date (${stage.actualDate}) synced from ${procCfg.dateColumnLabel} in ${procCfg.label}`
                                          : `Pending in ${procCfg.label}. Automatically set when ${procCfg.dateColumnLabel} is recorded.`
                                        : undefined
                                    }
                                  />
                                  {isProcLocked && !stage.actualDate && (
                                    <span className="text-[10px] text-amber-600 font-medium block mt-0.5">
                                      Awaiting receipt in {procCfg.label}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Time Delay */}
                              <td className="px-3 py-3 font-medium">
                                {isOnTime ? (
                                  <span className="text-slate-700 font-semibold">{delayText}</span>
                                ) : isDelay ? (
                                  <span className="text-slate-700 font-semibold">{delayText}</span>
                                ) : (
                                  <span className="text-slate-400 font-medium">{delayText}</span>
                                )}
                              </td>

                              {/* Remarks */}
                              <td className="px-4 py-3">
                                <div>
                                  <input
                                    type="text"
                                    disabled={isProcLocked}
                                    placeholder={isProcLocked ? "No remark recorded in procurement" : "Input"}
                                    value={stage.remarks || ''}
                                    onChange={(e) => handleStageChange(idx, 'remarks', e.target.value)}
                                    className={`w-full px-3 py-1.5 rounded-lg text-xs outline-hidden transition-all ${
                                      isProcLocked
                                        ? 'bg-slate-100/90 border border-slate-200 text-slate-800 font-medium cursor-not-allowed'
                                        : 'bg-white border border-slate-300 text-slate-700 placeholder-slate-400 focus:border-indigo-500'
                                    }`}
                                    title={
                                      isProcLocked && stage.remarks
                                        ? `Last Remark from ${procCfg.label}:\n"${stage.remarks}"${stage.remarkAuthor ? `\n— By ${stage.remarkAuthor}` : ''}${stage.remarkDate ? ` on ${formatDate(stage.remarkDate)}` : ''}`
                                        : undefined
                                    }
                                  />
                                  {isProcLocked && stage.remarkAuthor && (
                                    <div
                                      className="text-[10px] text-slate-400 mt-0.5 truncate"
                                      title={`By ${stage.remarkAuthor}${stage.remarkDate ? ` on ${formatDate(stage.remarkDate)}` : ''}`}
                                    >
                                      By {stage.remarkAuthor}
                                      {stage.remarkDate && ` • ${formatDate(stage.remarkDate)}`}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0 gap-3">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveUpdate}
                  className={`px-8 py-2.5 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                    isModalAllStagesComplete
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                      : 'bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3]'
                  }`}
                >
                  {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{isModalAllStagesComplete ? 'Complete & Move to History' : 'Save Update'}</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
