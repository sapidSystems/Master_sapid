import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout";
import useUnifiedCounts from "../hooks/useUnifiedCounts";
import KanbanBoard from "../components/kanban/KanbanBoard";
import {
  ALL_SYSTEM_CONFIGS,
  procurementConfig,
  productionConfig,
  sampleConfig,
  checklistConfig,
} from "../components/kanban/systemConfigs";
import {
  ClipboardList,
  Database,
  TrendingUp,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

export default function UnifiedDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const systemQuery = searchParams.get("system");

  // Selected system state (defaults to 'procurement' or system from query param)
  const [activeSystem, setActiveSystem] = useState(() => {
    if (systemQuery && ALL_SYSTEM_CONFIGS[systemQuery]) {
      return systemQuery;
    }
    return "checklist";
  });

  const username = localStorage.getItem("user-name") || "User";
  const userRole = localStorage.getItem("role") || "Staff";

  // Single source of truth for counts
  const { menuCounts, systemTotals, loading: countsLoading, refreshCounts } = useUnifiedCounts();

  // Active board state keyed by system to prevent cross-system item mismatches
  const [systemData, setSystemData] = useState({});
  const [isBoardLoading, setIsBoardLoading] = useState(false);

  // Sync activeSystem with query params
  useEffect(() => {
    if (systemQuery && ALL_SYSTEM_CONFIGS[systemQuery] && systemQuery !== activeSystem) {
      setActiveSystem(systemQuery);
    }
  }, [systemQuery]);

  // Load items for the active system
  const loadActiveSystemItems = useCallback(async (sysKey) => {
    const config = ALL_SYSTEM_CONFIGS[sysKey];
    if (!config || !config.fetchItems) return;

    try {
      setIsBoardLoading(true);
      const items = await config.fetchItems();
      setSystemData((prev) => ({ ...prev, [sysKey]: items }));
    } catch (err) {
      console.error(`Error loading items for ${sysKey}:`, err);
      setSystemData((prev) => ({ ...prev, [sysKey]: [] }));
    } finally {
      setIsBoardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveSystemItems(activeSystem);
  }, [activeSystem, loadActiveSystemItems]);

  const handleSelectSystem = (sysKey) => {
    setActiveSystem(sysKey);
    setSearchParams({ system: sysKey });
  };

  const handleRefreshAll = async () => {
    refreshCounts();
    await loadActiveSystemItems(activeSystem);
  };

  // Systems Definition for the 4 Tiles
  const systemTiles = [
    {
      id: "checklist",
      name: "Checklist",
      shortName: "Checklist",
      icon: ClipboardList,
      count: systemTotals.checklist,
      badgeLabel: "Pending Tasks",
      colorClass: "from-purple-600 to-indigo-600 text-purple-600",
      bgLight: "bg-purple-50/70 border-purple-200/80 hover:border-purple-400",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      iconBg: "bg-purple-600 text-white",
      description: "Routine tasks, maintenance, repairs, and approvals.",
      stagesCount: "5 Stages",
      stagePreview: "Today • Pending • Overdue • Approval • Done",
    },
    {
      id: "sample",
      name: "Sample System",
      shortName: "Samples",
      icon: Database,
      count: systemTotals.sample,
      badgeLabel: "Active Enquiries",
      colorClass: "from-blue-600 to-cyan-600 text-blue-600",
      bgLight: "bg-blue-50/70 border-blue-200/80 hover:border-blue-400",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      iconBg: "bg-blue-600 text-white",
      description: "Sampling lifecycle, NPD handover & buyer dispatch.",
      stagesCount: "5 Stages",
      stagePreview: "Received • Handover • Dev • Ready • Dispatched",
    },
    {
      id: "production",
      name: "Production Planning & Monitoring",
      shortName: "Production",
      icon: TrendingUp,
      count: systemTotals.production,
      badgeLabel: "Active Work Orders",
      colorClass: "from-emerald-600 to-teal-600 text-emerald-600",
      bgLight: "bg-emerald-50/70 border-emerald-200/80 hover:border-emerald-400",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      iconBg: "bg-emerald-600 text-white",
      description: "8-stage manufacturing milestone pipeline for work orders.",
      stagesCount: "8 Stages",
      stagePreview: "Handover • Leather • Cutting • Fabrication • QA",
    },
    {
      id: "procurement",
      name: "Procurement System",
      shortName: "Procurement",
      icon: Zap,
      count: systemTotals.procurement,
      badgeLabel: "Open Orders",
      colorClass: "from-amber-500 to-orange-600 text-amber-600",
      bgLight: "bg-amber-50/70 border-amber-200/80 hover:border-amber-400",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      iconBg: "bg-amber-500 text-white",
      description: "Leather development, materials & packaging tracking.",
      stagesCount: "4 Modules",
      stagePreview: "New Leather • Daily Leather • Materials • Packaging",
    },
  ];

  const activeConfig = ALL_SYSTEM_CONFIGS[activeSystem] || checklistConfig;

  return (
    <AdminLayout>
      <div className="w-full min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header / Welcome Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-gradient-to-bl from-purple-100/50 via-blue-100/30 to-transparent rounded-full pointer-events-none blur-2xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Unified App Home
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Welcome back, <span className="capitalize">{username}</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Unified overview of all operational pipelines. Select a system tile to inspect its Kanban board or jump directly to details.
              </p>
            </div>

            {/* Total Pending Counter Pill */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-soft-md flex items-center gap-4">
                <div>
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Total Active Items
                  </div>
                  <div className="text-2xl font-black tracking-tight">
                    {systemTotals.total}
                  </div>
                </div>
                <button
                  onClick={handleRefreshAll}
                  disabled={countsLoading || isBoardLoading}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
                  title="Refresh counts and boards"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${countsLoading || isBoardLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: 4 System Tiles (Home Dashboard) */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Core Operational Systems
            </h2>
            <span className="text-xs text-slate-400">
              Click any tile to open its Kanban board
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemTiles.map((sys) => {
              const isSelected = activeSystem === sys.id;
              const Icon = sys.icon;

              return (
                <div
                  key={sys.id}
                  onClick={() => handleSelectSystem(sys.id)}
                  className={`group relative rounded-2xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-white border-brand-500 shadow-md ring-2 ring-brand-500/20"
                      : `${sys.bgLight} bg-white shadow-soft-sm hover:shadow-md hover:-translate-y-0.5`
                  }`}
                >
                  <div>
                    {/* Tile Header: Icon & Count Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-soft-sm ${sys.iconBg}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border shadow-2xs ${
                            sys.count > 0 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sys.count > 0 ? "bg-rose-500" : "bg-slate-400"}`}></span>
                          {sys.count}
                        </span>
                      </div>
                    </div>

                    {/* System Name */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                      {sys.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {sys.description}
                    </p>
                  </div>

                  {/* Tile Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md">
                      {sys.stagesCount}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 font-bold text-xs transition-colors ${
                        isSelected ? "text-brand-600" : "text-slate-500 group-hover:text-brand-600"
                      }`}
                    >
                      <span>{isSelected ? "Active Board" : "Open Board"}</span>
                      <ArrowRight
                        className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-1 ${
                          isSelected ? "translate-x-0.5" : ""
                        }`}
                      />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Per-System Kanban Board View */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-soft-sm space-y-4">
          {/* Board Selector Tabs */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl overflow-x-auto max-w-full">
              {systemTiles.map((sys) => {
                const isSelected = activeSystem === sys.id;
                const Icon = sys.icon;
                return (
                  <button
                    key={sys.id}
                    onClick={() => handleSelectSystem(sys.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-white text-slate-900 shadow-soft-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-brand-600" : "text-slate-400"}`} />
                    <span>{sys.shortName}</span>
                    <span
                      className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? "bg-brand-50 text-brand-700" : "bg-slate-200/70 text-slate-600"
                      }`}
                    >
                      {sys.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Showing pipeline stages for <strong className="text-slate-700">{activeConfig.title}</strong>
            </span>
          </div>

          {/* Config-Driven Reusable Kanban Board Component */}
          <KanbanBoard
            title={activeConfig.title}
            subtitle={activeConfig.subtitle}
            systemIcon={activeConfig.icon}
            badgeCount={systemTotals[activeSystem] || 0}
            badgeLabel={activeConfig.badgeLabel}
            columns={activeConfig.columns}
            items={systemData[activeSystem] || []}
            getItemColumnId={activeConfig.getItemColumnId}
            renderCard={(item, colId) => activeConfig.renderCard(item, colId, navigate)}
            loading={isBoardLoading && !(systemData[activeSystem]?.length > 0)}
            onRefresh={() => loadActiveSystemItems(activeSystem)}
            viewAllRoute={activeConfig.viewAllRoute}
            onViewAllClick={() => activeConfig.viewAllRoute && navigate(activeConfig.viewAllRoute)}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
