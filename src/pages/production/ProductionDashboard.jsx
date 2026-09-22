import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Package,
  Layers,
  ArrowRight,
  Filter,
  Search,
  Boxes,
  Zap,
  ChevronRight
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { fetchProductionPlans, STAGES_LIST, formatDate } from './productionService';
import { useMagicToast } from '../../context/MagicToastContext';

export default function ProductionDashboard() {
  const { showToast } = useMagicToast();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState('all');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchProductionPlans();
      setPlans(data);
    } catch (err) {
      console.error('Error loading production plans:', err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Unique buyer codes
  const buyerOptions = useMemo(() => {
    const buyers = new Set();
    plans.forEach(p => {
      if (p.buyer) buyers.add(p.buyer);
    });
    return Array.from(buyers).sort();
  }, [plans]);

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      if (selectedBuyer !== 'all' && p.buyer !== selectedBuyer) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchWo = p.woNo && p.woNo.toLowerCase().includes(q);
        const matchBuyer = p.buyer && p.buyer.toLowerCase().includes(q);
        const matchRemarks = p.remarks && p.remarks.toLowerCase().includes(q);
        if (!matchWo && !matchBuyer && !matchRemarks) return false;
      }
      return true;
    });
  }, [plans, selectedBuyer, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const total = filteredPlans.length;
    const draft = filteredPlans.filter(p => !p.approvalStatus || p.approvalStatus === 'draft').length;
    const pending = filteredPlans.filter(p => p.approvalStatus === 'pending_approval').length;
    const approved = filteredPlans.filter(p => p.approvalStatus === 'approved').length;
    const rejected = filteredPlans.filter(p => p.approvalStatus === 'rejected').length;
    const totalQty = filteredPlans.reduce((sum, p) => sum + (Number(p.qty) || 0), 0);

    return { total, draft, pending, approved, rejected, totalQty };
  }, [filteredPlans]);

  // Stage completion counts
  const stageStats = useMemo(() => {
    return STAGES_LIST.map(stageName => {
      let completedCount = 0;
      let plannedCount = 0;
      filteredPlans.forEach(p => {
        const stageObj = p.stages?.find(s => s.name === stageName);
        if (stageObj) {
          if (stageObj.actualDate) completedCount++;
          else if (stageObj.plannedDate) plannedCount++;
        }
      });
      const percent = filteredPlans.length > 0 ? Math.round((completedCount / filteredPlans.length) * 100) : 0;
      return { stageName, completedCount, plannedCount, percent };
    });
  }, [filteredPlans]);

  // Procurement readiness metrics
  const procurementReadiness = useMemo(() => {
    const totalApproved = plans.filter(p => p.approvalStatus === 'approved').length;
    if (totalApproved === 0) return { leather: 0, materials: 0, packaging: 0 };

    let leatherDone = 0;
    let matDone = 0;
    let pkgDone = 0;

    plans.filter(p => p.approvalStatus === 'approved').forEach(p => {
      const lStage = p.stages?.find(s => s.name === 'LEATHER IN-HOUSE');
      const mStage = p.stages?.find(s => s.name === 'MATERIALS IN-HOUSE');
      const pStage = p.stages?.find(s => s.name === 'PACKING MATERIALS IN-HOUSE');

      if (lStage?.actualDate) leatherDone++;
      if (mStage?.actualDate) matDone++;
      if (pStage?.actualDate) pkgDone++;
    });

    return {
      leather: Math.round((leatherDone / totalApproved) * 100),
      materials: Math.round((matDone / totalApproved) * 100),
      packaging: Math.round((pkgDone / totalApproved) * 100),
      leatherDone,
      matDone,
      pkgDone,
      totalApproved
    };
  }, [plans]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50/50 pb-16">
        {/* Header Banner */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Production System</span>
                <span>•</span>
                <span className="text-brand-600">Module 1 of 4</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
                Production Planning & Monitoring Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Real-time tracking of work orders, stage milestones, approval pipeline, and procurement dispatch.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          {/* Quick Module Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              to="/dashboard/production"
              className="bg-brand-50/60 border-2 border-brand-500/30 p-4 rounded-2xl flex items-center justify-between shadow-xs transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-500 text-white">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-brand-700 uppercase tracking-wider">Page 1</div>
                  <div className="text-sm font-bold text-slate-900">Dashboard</div>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-700">Active</span>
            </Link>

            <Link
              to="/dashboard/production/data"
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 p-4 rounded-2xl flex items-center justify-between shadow-xs transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-slate-200 text-slate-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Page 2</div>
                  <div className="text-sm font-bold text-slate-900">Production Data</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/dashboard/production/planning"
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 p-4 rounded-2xl flex items-center justify-between shadow-xs transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-slate-200 text-slate-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Page 3</div>
                  <div className="text-sm font-bold text-slate-900">Production Planning</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/dashboard/production/approval"
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 p-4 rounded-2xl flex items-center justify-between shadow-xs transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-slate-200 text-slate-700">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Page 4</div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Approval</span>
                    {metrics.pending > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                        {metrics.pending}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by W/O No, Buyer Code, or Remarks..."
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
                {buyerOptions.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="text-xs font-medium text-slate-500">
              Showing <strong className="text-slate-900">{filteredPlans.length}</strong> work orders
            </div>
          </div>

          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total W/O</span>
                <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Package className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">{metrics.total}</div>
              <div className="mt-1 text-xs text-slate-500">
                {metrics.totalQty.toLocaleString()} total units
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data Entry (Draft)</span>
                <span className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <FileSpreadsheet className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-800">{metrics.draft}</div>
              <div className="mt-1 text-xs text-slate-500">Needs Plan Date in Page 3</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Approval</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-600">{metrics.pending}</div>
              <div className="mt-1 text-xs text-amber-600/80">Awaiting Page 4 Review</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600">{metrics.approved}</div>
              <div className="mt-1 text-xs text-emerald-600/80">Pushed to Procurement</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Rejected</span>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <XCircle className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-600">{metrics.rejected}</div>
              <div className="mt-1 text-xs text-rose-600/80">Needs Revision</div>
            </div>
          </div>

          {/* Stage Progress & Procurement Readiness */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stage Milestones (2 cols) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Stage Milestone Completion</h2>
                  <p className="text-xs text-slate-500">Breakdown across all 8 production milestones</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {filteredPlans.length} WOs Analyzed
                </span>
              </div>

              <div className="space-y-3.5">
                {stageStats.map((stg, idx) => (
                  <div key={stg.stageName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <span className="w-4.5 h-4.5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{stg.stageName}</span>
                      </span>
                      <span className="text-slate-500 font-mono">
                        <strong className="text-emerald-600">{stg.completedCount}</strong> / {filteredPlans.length} ({stg.percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${stg.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Procurement System Dispatch Status */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Procurement Dispatch</h2>
                    <p className="text-xs text-slate-500">Sync with Procurement System modules</p>
                  </div>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>

                <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  When a plan is approved in <strong>Page 4</strong>, it automatically dispatches records to the 3 daily procurement modules. When actual materials arrive, dates sync back here.
                </p>

                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>Daily Leather Procurement</span>
                      <span className="font-mono text-emerald-600">{procurementReadiness.leather}% Received</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${procurementReadiness.leather}%` }} />
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {procurementReadiness.leatherDone} of {procurementReadiness.totalApproved} approved orders in-house
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>Daily Material Procurement</span>
                      <span className="font-mono text-emerald-600">{procurementReadiness.materials}% Received</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${procurementReadiness.materials}%` }} />
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {procurementReadiness.matDone} of {procurementReadiness.totalApproved} approved orders in-house
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>Daily Packaging Procurement</span>
                      <span className="font-mono text-emerald-600">{procurementReadiness.packaging}% Received</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${procurementReadiness.packaging}%` }} />
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {procurementReadiness.pkgDone} of {procurementReadiness.totalApproved} approved orders in-house
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to="/dashboard/procurement"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <span>Open Procurement System</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/dashboard/production/approval"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Review Approvals
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Production Work Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Work Orders</h3>
                <p className="text-xs text-slate-500">Latest active production orders across the pipeline</p>
              </div>
              <Link
                to="/dashboard/production/data"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>View Full Table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">W/O No</th>
                    <th className="px-4 py-3">Buyer</th>
                    <th className="px-4 py-3">W/O Date</th>
                    <th className="px-4 py-3">Shipment Date</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3">Plan Date</th>
                    <th className="px-4 py-3">Approval Status</th>
                    <th className="px-4 py-3">Leather Stage</th>
                    <th className="px-4 py-3">Material Stage</th>
                    <th className="px-4 py-3">Packaging Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredPlans.slice(0, 10).map((p) => {
                    const lStage = p.stages?.find(s => s.name === 'LEATHER IN-HOUSE');
                    const mStage = p.stages?.find(s => s.name === 'MATERIALS IN-HOUSE');
                    const pStage = p.stages?.find(s => s.name === 'PACKING MATERIALS IN-HOUSE');

                    const getStatusBadge = (status) => {
                      switch (status) {
                        case 'approved':
                          return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">Approved</span>;
                        case 'pending_approval':
                          return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">Pending Approval</span>;
                        case 'rejected':
                          return <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">Rejected</span>;
                        default:
                          return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">Draft</span>;
                      }
                    };

                    const getStageStatus = (stage) => {
                      if (!stage) return <span className="text-slate-300">—</span>;
                      if (stage.actualDate) {
                        return (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                            Recd {formatDate(stage.actualDate)}
                          </span>
                        );
                      }
                      if (stage.plannedDate) {
                        return <span className="text-slate-600 font-medium">Plan {formatDate(stage.plannedDate)}</span>;
                      }
                      return <span className="text-slate-400 text-[11px]">Pending</span>;
                    };

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 font-mono">{p.woNo}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-slate-700 text-[11px]">
                            {p.buyer || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(p.woDate)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(p.woDespatchDate)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {Number(p.qty || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {p.planDate ? (
                            <span className="font-semibold text-brand-700">{formatDate(p.planDate)}</span>
                          ) : (
                            <span className="text-slate-400 italic">Not set</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(p.approvalStatus)}</td>
                        <td className="px-4 py-3">{getStageStatus(lStage)}</td>
                        <td className="px-4 py-3">{getStageStatus(mStage)}</td>
                        <td className="px-4 py-3">{getStageStatus(pStage)}</td>
                      </tr>
                    );
                  })}
                  {filteredPlans.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                        No production plans found matching the filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
