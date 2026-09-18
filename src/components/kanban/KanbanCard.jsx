import React from "react";
import { Clock, Calendar, ArrowRight, User } from "lucide-react";

export default function KanbanCard({
  id,
  title,
  subtitle,
  badgeText,
  badgeColor = "bg-gray-100 text-gray-700 border-gray-200",
  status,
  statusColor = "bg-gray-100 text-gray-700",
  cardStyle = "",
  datePrimary,
  dateSecondary,
  datePrimaryLabel = "Due",
  dateSecondaryLabel = "Actual",
  tags = [],
  assignee,
  metrics = [],
  onClick,
  customSlot,
  className = "",
}) {
  const defaultCardStyle = "bg-white border border-gray-200/90 shadow-xs hover:shadow-md hover:border-brand-300";
  const activeCardStyle = cardStyle || defaultCardStyle;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col gap-2.5 ${activeCardStyle} ${className}`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {badgeText && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border tracking-wide uppercase ${badgeColor}`}
            >
              {badgeText}
            </span>
          )}
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700"
            >
              {tag}
            </span>
          ))}
        </div>

        {status && (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {status}
          </span>
        )}
      </div>

      {/* Main Title & Subtitle */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
          {title || "Untitled Record"}
        </h4>
        {subtitle && (
          <p className="text-xs text-gray-500 font-medium mt-0.5 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Custom Slot (for module-specific pills/details) */}
      {customSlot && <div className="text-xs text-gray-600">{customSlot}</div>}

      {/* Metrics Row (if any) */}
      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-2 py-1 border-t border-b border-gray-100 text-xs">
          {metrics.map((m, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-gray-400">
                {m.label}
              </span>
              <span className="font-semibold text-gray-800 truncate">
                {m.value || "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Dates & Assignee Footer */}
      <div className="flex items-center justify-between pt-1 text-xs text-gray-500 mt-auto border-t border-gray-50">
        <div className="flex items-center gap-3">
          {dateSecondary && (
            <div className="flex items-center gap-1 text-[11px]" title={`${dateSecondaryLabel}: ${dateSecondary}`}>
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{dateSecondary}</span>
            </div>
          )}
          {datePrimary && (
            <div className="flex items-center gap-1 text-[11px]" title={`${datePrimaryLabel}: ${datePrimary}`}>
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{datePrimary}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {assignee ? (
            <div
              className="flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full"
              title={`Assigned to: ${assignee}`}
            >
              <div className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold uppercase">
                {assignee.charAt(0)}
              </div>
              <span className="max-w-[70px] truncate">{assignee}</span>
            </div>
          ) : (
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
          )}
        </div>
      </div>
    </div>
  );
}
