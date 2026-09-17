import React from "react";
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, RotateCcw, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function DetailHeader({
  record,
  systemConfig,
  systemId,
  onBack,
  onStatusChange,
  isUpdating = false,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (record?.id || record?.woNo || record?.task_id) {
      navigator.clipboard.writeText(record.id || record.woNo || record.task_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = () => {
    if (record?.isCompleted) {
      return {
        label: "Completed",
        bg: "bg-blue-100 text-blue-700 border-blue-200",
        icon: CheckCircle2,
      };
    }
    if (record?.isDelayed) {
      return {
        label: "Delayed / Overdue",
        bg: "bg-rose-100 text-rose-700 border-rose-200",
        icon: AlertTriangle,
      };
    }
    return {
      label: "In Progress",
      bg: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: Clock,
    };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  const displayId = record?.woNo || record?.sampleWONo || record?.task_id || record?.id || "Record";
  const displayTitle = record?.title || record?.taskDescription || record?.productName || record?.leatherName || displayId;
  const displaySubtitle = record?.buyer || record?.buyerCoder || record?.buyerCode || record?.department || "";

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shadow-xs">
      {/* Top row: Back button & Breadcrumbs */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {systemConfig?.title || "Board"}</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400 font-medium">{systemConfig?.title}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-bold truncate max-w-[200px]">
            {displayId}
          </span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border tracking-wide ${status.bg}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{status.label}</span>
          </span>
        </div>
      </div>

      {/* Main title & Action controls row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold transition-colors"
              title="Click to copy identifier"
            >
              <span>{displayId}</span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
            <span className="text-slate-300 font-light text-lg">|</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
              {displayTitle}
            </h1>
            {displaySubtitle && (
              <>
                <span className="text-slate-300 font-light text-lg hidden sm:inline">|</span>
                <span className="text-sm font-semibold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                  {displaySubtitle}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side: Owner & Status action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Owner Avatar & Name */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold uppercase">
              {(record?.owner || record?.addedBy || record?.name || "U").charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">
                Owner
              </span>
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {record?.owner || record?.addedBy || record?.name || "System"}
              </span>
            </div>
          </div>

          {/* Status Change Action Buttons */}
          {record?.isCompleted ? (
            <button
              onClick={() => onStatusChange && onStatusChange("reopen")}
              disabled={isUpdating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-soft-sm disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reopen Record</span>
            </button>
          ) : (
            <button
              onClick={() => onStatusChange && onStatusChange("complete")}
              disabled={isUpdating}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-soft-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark as Completed</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
