import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Calendar,
  Layers,
} from "lucide-react";
import { formatDateDisplay } from "../kanban/systemConfigs";

export default function PlanTab({
  record,
  systemConfig,
  stages = [],
  milestones = [],
  onToggleMilestone,
  onAdvanceStage,
}) {
  // Collapsible state for each stage (default all open)
  const [collapsedStages, setCollapsedStages] = useState({});

  const toggleStage = (stageId) => {
    setCollapsedStages((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
  };

  // Group milestones by stage
  const stageGroups = stages.map((stg) => {
    const stageMilestones = milestones.filter(
      (m) => m.stageId === stg.id || m.stageName === stg.title || m.stageName === stg.id
    );
    const completed = stageMilestones.filter((m) => m.isCompleted).length;
    const total = stageMilestones.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      ...stg,
      milestones: stageMilestones,
      completed,
      total,
      percent,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Phase & Milestone Roadmap
          </h3>
          <p className="text-xs text-slate-500">
            Work order broken down into operational phases matching the system Kanban pipeline.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {stages.length} Total Phases
        </div>
      </div>

      {/* Accordion List by Stage */}
      <div className="space-y-3">
        {stageGroups.map((stg, idx) => {
          const isCollapsed = collapsedStages[stg.id];
          const isStageDone = stg.total > 0 && stg.completed === stg.total;
          const isCurrentActive = !isStageDone && (idx === 0 || stageGroups[idx - 1]?.completed === stageGroups[idx - 1]?.total);

          return (
            <div
              key={stg.id}
              className={`bg-white rounded-2xl border transition-all duration-200 shadow-soft-sm overflow-hidden ${
                isCurrentActive
                  ? "border-brand-300 ring-1 ring-brand-400/20"
                  : isStageDone
                  ? "border-slate-200 bg-slate-50/30"
                  : "border-slate-200"
              }`}
            >
              {/* Stage Header */}
              <div
                onClick={() => toggleStage(stg.id)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button className="text-slate-400 hover:text-slate-700">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        stg.accentColor || (isStageDone ? "bg-emerald-500" : "bg-slate-300")
                      }`}
                    />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Phase {idx + 1}
                    </span>
                    <span className="text-slate-300">/</span>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {stg.title}
                    </h4>
                  </div>
                </div>

                {/* Right side of Stage Header */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Progress fraction & mini bar */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-700 text-[11px]">
                      {stg.completed}/{stg.total}
                    </span>
                    <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isStageDone ? "bg-emerald-500" : "bg-brand-600"
                        }`}
                        style={{ width: `${stg.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Stage Status Pill */}
                  {isStageDone ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Completed
                    </span>
                  ) : isCurrentActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                      <Clock className="w-3 h-3 text-brand-600 animate-spin" />
                      In Progress
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Stage Milestone Table Body */}
              {!isCollapsed && (
                <div className="border-t border-slate-100 p-3 sm:p-4 bg-white">
                  {stg.milestones.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">
                      No discrete sub-tasks recorded for this phase.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="pb-2 pl-2 w-8">Done</th>
                            <th className="pb-2">Milestone Subject</th>
                            <th className="pb-2">Assignee</th>
                            <th className="pb-2">Target Date</th>
                            <th className="pb-2">Actual Date</th>
                            <th className="pb-2">Remarks</th>
                            <th className="pb-2 pr-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {stg.milestones.map((m) => {
                            return (
                              <tr
                                key={m.id}
                                className="hover:bg-slate-50/80 transition-colors group"
                              >
                                <td className="py-2.5 pl-2">
                                  <input
                                    type="checkbox"
                                    checked={m.isCompleted}
                                    onChange={() => onToggleMilestone && onToggleMilestone(m.id)}
                                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                                  />
                                </td>
                                <td className="py-2.5 font-bold text-slate-900">
                                  <span className={m.isCompleted ? "line-through text-slate-400" : ""}>
                                    {m.name || m.title}
                                  </span>
                                </td>
                                <td className="py-2.5 text-slate-600">
                                  {m.assignee ? (
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold uppercase">
                                        {m.assignee.charAt(0)}
                                      </div>
                                      <span className="truncate max-w-[100px]">{m.assignee}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 text-slate-600 font-medium">
                                  {formatDateDisplay(m.plannedDate) || "—"}
                                </td>
                                <td className="py-2.5 text-slate-600 font-medium">
                                  {formatDateDisplay(m.actualDate) || "—"}
                                </td>
                                <td className="py-2.5 text-slate-500 italic truncate max-w-[150px]">
                                  {m.remarks || "—"}
                                </td>
                                <td className="py-2.5 pr-2 text-right">
                                  {m.isCompleted ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                      Done
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                      Open
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
