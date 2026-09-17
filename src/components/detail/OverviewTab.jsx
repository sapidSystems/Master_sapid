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
  const [scheduleFilter, setScheduleFilter] = useState("upcoming"); // 'upcoming' | 'overdue'

  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const totalCount = milestones.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Split upcoming vs overdue
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const pendingMilestones = milestones.filter((m) => !m.isCompleted);
  const overdueMilestones = pendingMilestones.filter((m) => {
    if (!m.plannedDate) return false;
    const d = new Date(m.plannedDate);
    return d < now;
  });
  const upcomingMilestones = pendingMilestones.filter((m) => {
    if (!m.plannedDate) return true;
    const d = new Date(m.plannedDate);
    return d >= now;
  });

  const displayedScheduleItems =
    scheduleFilter === "overdue" ? overdueMilestones : upcomingMilestones;

  // Next active milestone
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
              ({pendingMilestones.length} remaining)
            </span>
          </div>

          {/* Sub-tabs: Upcoming vs Overdue */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
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
          {displayedScheduleItems.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">
                No {scheduleFilter} tasks right now
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All milestones in this category have been attended to.
              </p>
            </div>
          ) : (
            displayedScheduleItems.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={m.isCompleted}
                    onChange={() => onToggleMilestone && onToggleMilestone(m.id)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${m.isCompleted ? "line-through text-slate-400" : "text-slate-900"}`}>
                      {m.name || m.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Stage: {m.stageName || "Standard"}
                      {m.remarks && ` • ${m.remarks}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {m.plannedDate && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formatDateDisplay(m.plannedDate)}</span>
                    </span>
                  )}
                  {m.assignee && (
                    <div
                      className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold uppercase"
                      title={m.assignee}
                    >
                      {m.assignee.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
