import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { formatDateDisplay } from "../kanban/systemConfigs";

export default function OverviewTab({
  record,
  milestones = [],
  onToggleMilestone,
  systemConfig,
}) {
  const [scheduleFilter, setScheduleFilter] = useState("all"); // 'all' | 'upcoming' | 'overdue'

  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const totalCount = milestones.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Split upcoming vs overdue
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Helper to compute delay text and status for each milestone
  const getDelayInfo = (plannedDate, actualDate) => {
    if (!plannedDate) return { text: "—", isDelay: false, isOnTime: false };
    try {
      const p = new Date(plannedDate);
      if (isNaN(p.getTime())) return { text: "—", isDelay: false, isOnTime: false };
      p.setHours(0, 0, 0, 0);

      if (actualDate) {
        const a = new Date(actualDate);
        if (isNaN(a.getTime())) return { text: "—", isDelay: false, isOnTime: false };
        a.setHours(0, 0, 0, 0);
        const diffTime = a.getTime() - p.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) return { text: `${diffDays}d delay`, isDelay: true, isOnTime: false };
        if (diffDays === 0) return { text: "On time", isDelay: false, isOnTime: true };
        return { text: `${Math.abs(diffDays)}d early`, isDelay: false, isOnTime: true };
      } else {
        if (now > p) {
          const diffTime = now.getTime() - p.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          return { text: `${diffDays}d delay`, isDelay: true, isOnTime: false };
        }
        return { text: "—", isDelay: false, isOnTime: false };
      }
    } catch {
      return { text: "—", isDelay: false, isOnTime: false };
    }
  };

  const isMilestoneOverdue = (m) => {
    const delayInfo = getDelayInfo(m.plannedDate, m.actualDate);
    return delayInfo.isDelay;
  };

  const overdueMilestones = milestones.filter(isMilestoneOverdue);
  const upcomingMilestones = milestones.filter((m) => !isMilestoneOverdue(m));

  const displayedScheduleItems =
    scheduleFilter === "overdue"
      ? overdueMilestones
      : scheduleFilter === "all"
      ? milestones
      : upcomingMilestones;

  // Next active milestone
  const pendingMilestones = milestones.filter((m) => !m.isCompleted);
  const nextMilestone = pendingMilestones[0] || null;

  return (
    <div className="space-y-6">
      {/* 1. Health & Progress Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progress Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-soft-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Project Completion Progress
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900">
                  {progressPercent}%
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({completedCount}/{totalCount} milestones completed)
                </span>
              </div>
            </div>

            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressPercent === 100
                  ? "bg-emerald-500"
                  : progressPercent > 50
                  ? "bg-brand-600"
                  : "bg-amber-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Health Signal Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Current Health Status
          </span>

          <div className="my-2">
            {record?.isCompleted ? (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-lg font-bold text-blue-700">Completed</span>
              </div>
            ) : record?.isDelayed ? (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-lg font-bold text-rose-700">Delayed</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-lg font-bold text-emerald-700">On Track</span>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">
              {record?.isCompleted
                ? "All stages and requirements fulfilled."
                : record?.isDelayed
                ? "Target milestone date has lapsed."
                : "Proceeding according to scheduled timeline."}
            </p>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Target:</span>
            <strong className="text-slate-700">
              {formatDateDisplay(record?.targetReceiptDate || record?.despatchDate || record?.requirementDate || record?.planned_date) || "—"}
            </strong>
          </div>
        </div>
      </div>

      {/* 2. Next Active Milestone Hero Card */}
      {nextMilestone && (
        <div className="bg-gradient-to-r from-brand-50 to-indigo-50/60 rounded-2xl border border-brand-200/80 p-5 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-brand-200 text-brand-600 flex items-center justify-center shadow-xs flex-shrink-0">
              <Sparkles className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                Next Active Action
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">
                {nextMilestone.name || nextMilestone.title}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Stage: <strong className="text-slate-800">{nextMilestone.stageName || "In Progress"}</strong>
                {nextMilestone.plannedDate && (
                  <> • Due: <strong className="text-slate-800">{formatDateDisplay(nextMilestone.plannedDate)}</strong></>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => onToggleMilestone && onToggleMilestone(nextMilestone.id)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-soft-sm transition-colors flex-shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark Complete</span>
          </button>
        </div>
      )}

      {/* 3. Schedule Sub-Section (Upcoming vs Overdue) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Task Schedule</h3>
            <span className="text-xs text-slate-400 font-medium">
              ({milestones.length} total tasks)
            </span>
          </div>

          {/* Sub-tabs: All vs Upcoming vs Overdue */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setScheduleFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                scheduleFilter === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All ({milestones.length})
            </button>
            <button
              onClick={() => setScheduleFilter("upcoming")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                scheduleFilter === "upcoming"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Upcoming ({upcomingMilestones.length})
            </button>
            <button
              onClick={() => setScheduleFilter("overdue")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                scheduleFilter === "overdue"
                  ? "bg-white text-rose-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Overdue ({overdueMilestones.length})
            </button>
          </div>
        </div>

        {/* Milestone Schedule List */}
        <div className="space-y-2">
          {/* Column Headers */}
          <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/70 rounded-lg">
            <div className="col-span-4">Task & Stage</div>
            <div className="col-span-2">Plan Time</div>
            <div className="col-span-2">Actual Time</div>
            <div className="col-span-2">Delay</div>
            <div className="col-span-2">Remark</div>
          </div>

          {displayedScheduleItems.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">
                {scheduleFilter === "all" ? "No tasks found" : `No ${scheduleFilter} tasks right now`}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All milestones in this category have been attended to.
              </p>
            </div>
          ) : (
            displayedScheduleItems.map((m) => {
              const delayInfo = getDelayInfo(m.plannedDate, m.actualDate);
              return (
                <div
                  key={m.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group"
                >
                  {/* Column 1: Task Name & Stage */}
                  <div className="sm:col-span-4 flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={m.isCompleted}
                      onChange={() => onToggleMilestone && onToggleMilestone(m.id)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${m.isCompleted ? "line-through text-slate-500" : "text-slate-900"}`}>
                        {m.name || m.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        Stage: {m.stageName || "Standard"}
                      </p>
                    </div>
                  </div>

                  {/* Column 2: Plan Time */}
                  <div className="sm:col-span-2 text-xs">
                    <span className="sm:hidden font-semibold text-slate-400 text-[10px] uppercase mr-1">Plan Time:</span>
                    {m.plannedDate ? (
                      <span className="inline-flex items-center gap-1 font-mono font-medium text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatDateDisplay(m.plannedDate)}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">—</span>
                    )}
                  </div>

                  {/* Column 3: Actual Time */}
                  <div className="sm:col-span-2 text-xs">
                    <span className="sm:hidden font-semibold text-slate-400 text-[10px] uppercase mr-1">Actual Time:</span>
                    {m.actualDate ? (
                      <span className="inline-flex items-center gap-1 font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        <span>{formatDateDisplay(m.actualDate)}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">—</span>
                    )}
                  </div>

                  {/* Column 4: Delay */}
                  <div className="sm:col-span-2 text-xs">
                    <span className="sm:hidden font-semibold text-slate-400 text-[10px] uppercase mr-1">Delay:</span>
                    {delayInfo.text !== "—" ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          delayInfo.isDelay
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : delayInfo.isOnTime
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-blue-100 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {delayInfo.text}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">—</span>
                    )}
                  </div>

                  {/* Column 5: Remark */}
                  <div className="sm:col-span-2 text-xs min-w-0" title={m.remarks || ""}>
                    <span className="sm:hidden font-semibold text-slate-400 text-[10px] uppercase mr-1">Remark:</span>
                    {m.remarks && String(m.remarks).trim() ? (
                      <span className="text-slate-700 font-medium truncate block">
                        {m.remarks}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">—</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
