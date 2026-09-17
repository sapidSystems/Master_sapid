import React from "react";
import { Inbox, Plus } from "lucide-react";

export default function KanbanColumn({
  id,
  title,
  subtitle,
  count = 0,
  accentColor = "bg-brand-500",
  badgeBg = "bg-slate-200/80 text-slate-700",
  icon: Icon,
  children,
  onAddClick,
  emptyMessage = "No records in this stage",
  className = "",
}) {
  return (
    <div
      className={`flex flex-col min-w-[300px] max-w-[340px] flex-1 bg-slate-50/90 rounded-2xl border border-slate-200/80 shadow-soft-sm overflow-hidden flex-shrink-0 ${className}`}
    >
      {/* Column Header */}
      <div className="p-3.5 border-b border-slate-200/70 bg-white/70 backdrop-blur-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${accentColor}`} />
          {Icon && <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />}
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 truncate uppercase tracking-wider">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${badgeBg}`}
          >
            {count}
          </span>
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Add record"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Cards Scroll Container */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-270px)] min-h-[350px] thin-scrollbar">
        {count === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400 p-4 text-center">
            <Inbox className="w-7 h-7 text-slate-300 mb-1.5 stroke-[1.5]" />
            <p className="text-xs font-medium text-slate-500">{emptyMessage}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">All clear for now</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
