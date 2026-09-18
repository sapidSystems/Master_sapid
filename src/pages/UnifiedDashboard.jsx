import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout";
import useUnifiedCounts from "../hooks/useUnifiedCounts";
import KanbanBoard from "../components/kanban/KanbanBoard";
import {
  ALL_SYSTEM_CONFIGS,
  sampleConfig,
} from "../components/kanban/systemConfigs";
import {
  Database,
  TrendingUp,
  Zap,
  CheckCircle2,
  ChevronDown,
  Layers,
  RefreshCw,
} from "lucide-react";

export default function UnifiedDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const systemQuery = searchParams.get("system");

  // Selected system state (defaults to 'sample' or system from query param)
  const [activeSystem, setActiveSystem] = useState(() => {
    if (systemQuery && ALL_SYSTEM_CONFIGS[systemQuery] && systemQuery !== "checklist") {
      return systemQuery;
    }
    return "sample";
  });

  // Single source of truth for counts
  const { menuCounts, systemTotals, loading: countsLoading, refreshCounts } = useUnifiedCounts();

  // Active board state keyed by system to prevent cross-system item mismatches
  const [systemData, setSystemData] = useState({});
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  const [isSystemDropdownOpen, setIsSystemDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSystemDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync activeSystem with query params
  useEffect(() => {
    if (systemQuery && ALL_SYSTEM_CONFIGS[systemQuery] && systemQuery !== "checklist" && systemQuery !== activeSystem) {
      setActiveSystem(systemQuery);
    }
  }, [systemQuery, activeSystem]);

  // Load items for the active system
  const loadActiveSystemItems = useCallback(async (sysKey) => {
    if (sysKey === "checklist") {
      setActiveSystem("sample");
      return;
    }
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

  // Systems Definition for the 3 Tiles (Sample, Production, Procurement)
  const systemTiles = [
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

  const activeConfig = ALL_SYSTEM_CONFIGS[activeSystem] || sampleConfig;

  return (
    <AdminLayout>
      <div className="w-full min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header Bar: Total Active Items on the left, Core Operational Systems Dropdown on the right */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-soft-sm relative z-30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left Side: Total Active Items & Core Operational Systems Title */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              {/* Total Active Items Badge */}
              <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-soft-sm flex items-center gap-3.5">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Active Items
                  </div>
                  <div className="text-xl sm:text-2xl font-black tracking-tight leading-none mt-0.5">
                    {(systemTotals.sample || 0) + (systemTotals.production || 0) + (systemTotals.procurement || 0)}
                  </div>
                </div>
                <button
                  onClick={handleRefreshAll}
                  disabled={countsLoading || isBoardLoading}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
                  title="Refresh counts and boards"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${countsLoading || isBoardLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {/* Subtle Divider */}
              <div className="hidden sm:block h-8 w-px bg-slate-200"></div>

              {/* Core Operational Systems Heading */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Core Operational Systems
                  </h2>
                  <p className="text-sm font-bold text-slate-800 leading-tight">
                    Select a pipeline to inspect
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side: Dropdown Selector Component */}
            <div className="relative" ref={dropdownRef}>
              {(() => {
                const currentSystem = systemTiles.find((s) => s.id === activeSystem) || systemTiles[0];
                const CurrentIcon = currentSystem.icon;

                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsSystemDropdownOpen((prev) => !prev)}
                      className="flex items-center justify-between gap-3 min-w-[280px] sm:min-w-[340px] bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-4 py-2.5 text-left transition-all shadow-2xs hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${currentSystem.iconBg}`}>
                          <CurrentIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {currentSystem.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {currentSystem.stagesCount} • {currentSystem.count || 0} active
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                          {currentSystem.count}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                            isSystemDropdownOpen ? "rotate-180 text-brand-600" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Dropdown Options Popup */}
                    {isSystemDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-full sm:w-[360px] bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 space-y-1 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                          Select Pipeline
                        </div>
                        {systemTiles.map((sys) => {
                          const isSelected = activeSystem === sys.id;
                          const Icon = sys.icon;
                          return (
                            <button
                              key={sys.id}
                              type="button"
                              onClick={() => {
                                handleSelectSystem(sys.id);
                                setIsSystemDropdownOpen(false);
                              }}
                              className={`flex items-center justify-between w-full p-2.5 rounded-xl text-left transition-all ${
                                isSelected
                                  ? "bg-indigo-50/80 text-indigo-950 font-semibold border border-indigo-100"
                                  : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${sys.iconBg}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate flex items-center gap-2">
                                    <span>{sys.name}</span>
                                    {isSelected && (
                                      <span className="text-[10px] text-indigo-600 font-bold bg-white px-1.5 py-0.5 rounded-md border border-indigo-200">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 line-clamp-1">
                                    {sys.description}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {sys.count}
                                </span>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Step 2: Per-System Kanban Board View */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-soft-sm">
          {/* Config-Driven Reusable Kanban Board Component */}
          <KanbanBoard
            pipelineId={activeSystem}
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
