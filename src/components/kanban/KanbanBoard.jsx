import React, { useState, useMemo } from "react";
import { Search, X, Layers, RefreshCw, Filter, ArrowUpRight } from "lucide-react";
import KanbanColumn from "./KanbanColumn";
import DraggableScroll from "../DraggableScroll";

export default function KanbanBoard({
  title,
  subtitle,
  systemIcon: SystemIcon = Layers,
  badgeCount,
  badgeLabel = "Open Items",
  columns = [],
  items = [],
  getItemColumnId,
  renderCard,
  onCardClick,
  onRefresh,
  loading = false,
  headerActions,
  viewAllRoute,
  onViewAllClick,
  className = "",
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Group and filter items
  const { columnMap, totalFilteredItems } = useMemo(() => {
    const map = {};
    columns.forEach((col) => {
      map[col.id] = [];
    });

    const q = searchQuery.trim().toLowerCase();

    let count = 0;
    items.forEach((item) => {
      if (q) {
        const itemStr = JSON.stringify(item).toLowerCase();
        if (!itemStr.includes(q)) {
          return;
        }
      }

      const colId = getItemColumnId ? getItemColumnId(item) : item.stage || item.status || item.module;
      if (map[colId]) {
        map[colId].push(item);
        count++;
      }
    });

    return { columnMap: map, totalFilteredItems: count };
  }, [columns, items, getItemColumnId, searchQuery]);

  return (
    <div className={`flex flex-col h-full space-y-4 ${className}`}>
      {/* Board Top Header / Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-soft-sm flex-shrink-0">
            <SystemIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              {badgeCount !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200/60">
                  {badgeCount} {badgeLabel}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards, WO, buyer..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-soft-sm disabled:opacity-50"
              title="Refresh board data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-600" : ""}`} />
            </button>
          )}

          {headerActions}

          {(viewAllRoute || onViewAllClick) && (
            <button
              onClick={onViewAllClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-soft-sm"
            >
              <span>View Table</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Board Columns (Horizontal Scrolling) */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="min-w-[300px] w-[320px] h-96 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 animate-pulse space-y-3"
              >
                <div className="h-5 bg-slate-200 rounded-md w-3/4 mb-4"></div>
                <div className="h-28 bg-white border border-slate-200/60 rounded-xl p-3 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                </div>
                <div className="h-28 bg-white border border-slate-200/60 rounded-xl p-3 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                  <div className="h-3 bg-slate-100 rounded w-4/5"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto pb-4 thin-scrollbar">
            <div className="flex items-start gap-4 min-w-max">
              {columns.map((col) => {
                const colItems = columnMap[col.id] || [];
                return (
                  <KanbanColumn
                    key={col.id}
                    id={col.id}
                    title={col.title}
                    subtitle={col.subtitle}
                    count={colItems.length}
                    accentColor={col.accentColor}
                    badgeBg={col.badgeBg}
                    icon={col.icon}
                    onAddClick={col.onAddClick}
                    emptyMessage={col.emptyMessage}
                  >
                    {colItems.map((item, itemIdx) => {
                      if (!item) return null;
                      const itemKey = item.id || item.task_id || `${item.wo_no || col.id}-${itemIdx}`;
                      return (
                        <div key={itemKey}>
                          {renderCard ? (
                            renderCard(item, col.id)
                          ) : (
                            <div
                              onClick={() => onCardClick && onCardClick(item)}
                              className="bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-xs"
                            >
                              {JSON.stringify(item)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </KanbanColumn>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
