import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Calendar,
  Layers,
  Tag,
  Hash,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Briefcase,
} from "lucide-react";
import { formatDateDisplay } from "../kanban/systemConfigs";

export default function DetailSidebar({
  record,
  systemConfig,
  systemId,
  isCollapsed,
  onToggleCollapse,
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (key, value) => {
    if (value) {
      navigator.clipboard.writeText(String(value));
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-slate-200 bg-slate-50 flex flex-col items-center py-4 gap-4 flex-shrink-0 transition-all">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Expand sidebar details"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">
          {(record?.owner || record?.addedBy || record?.name || "U").charAt(0)}
        </div>
      </div>
    );
  }

  // Generate Key-Value Details based on available fields
  const detailFields = [];

  if (record?.woNo) detailFields.push({ key: "woNo", label: "Work Order #", value: record.woNo, copyable: true });
  if (record?.sampleWONo) detailFields.push({ key: "sampleWONo", label: "Sample WO #", value: record.sampleWONo, copyable: true });
  if (record?.task_id) detailFields.push({ key: "task_id", label: "Task ID", value: record.task_id, copyable: true });
  if (record?.buyer || record?.buyerCoder || record?.buyerCode) {
    detailFields.push({
      key: "buyer",
      label: "Customer / Buyer",
      value: record.buyer || record.buyerCoder || record.buyerCode,
    });
  }
  if (record?.department) detailFields.push({ key: "department", label: "Department", value: record.department });
  if (record?.tannery) detailFields.push({ key: "tannery", label: "Tannery", value: record.tannery });
  if (record?.supplier) detailFields.push({ key: "supplier", label: "Supplier", value: record.supplier });
  if (record?.type) detailFields.push({ key: "type", label: "Sample Type", value: record.type });
  if (record?.colour) detailFields.push({ key: "colour", label: "Colour", value: record.colour });
  if (record?.quantity || record?.qty) {
    detailFields.push({
      key: "qty",
      label: "Quantity",
      value: `${record.quantity || record.qty} ${record.unit || "pcs"}`,
    });
  }
  if (record?.currentStageName || record?.activeStage) {
    detailFields.push({
      key: "stage",
      label: "Current Stage",
      value: record.currentStageName || record.activeStage,
    });
  }
  if (record?.date || record?.receiptDate || record?.woDate || record?.created_at) {
    detailFields.push({
      key: "created",
      label: "Start / Order Date",
      value: formatDateDisplay(record.date || record.receiptDate || record.woDate || record.created_at),
    });
  }
  if (record?.targetReceiptDate || record?.despatchDate || record?.requirementDate || record?.planned_date) {
    detailFields.push({
      key: "target",
      label: "Target Date",
      value: formatDateDisplay(
        record.targetReceiptDate || record.despatchDate || record.requirementDate || record.planned_date
      ),
    });
  }
  if (record?.actualReceiptDate || record?.actualCompletionDate || record?.submission_date) {
    detailFields.push({
      key: "actual",
      label: "Actual Completion",
      value: formatDateDisplay(
        record.actualReceiptDate || record.actualCompletionDate || record.submission_date
      ),
    });
  }

  // Participants list
  const participants = [];
  const ownerName = record?.owner || record?.addedBy || record?.name;
  if (ownerName) {
    participants.push({
      name: ownerName,
      role: "Lead Owner / Assignee",
      iconBg: "bg-brand-600 text-white",
    });
  }
  const givenBy = record?.given_by;
  if (givenBy && givenBy !== ownerName) {
    participants.push({
      name: givenBy,
      role: "Assigned By",
      iconBg: "bg-purple-600 text-white",
    });
  }
  const party = record?.buyer || record?.buyerCoder || record?.buyerCode || record?.tannery || record?.supplier;
  if (party) {
    participants.push({
      name: party,
      role: record?.tannery || record?.supplier ? "Vendor / Supplier" : "Client / Buyer",
      iconBg: "bg-slate-700 text-white",
    });
  }

  return (
    <div className="w-80 border-r border-slate-200 bg-white flex flex-col flex-shrink-0 min-h-[calc(100vh-140px)] shadow-xs">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Project Details
        </span>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto thin-scrollbar">
        {/* Participants Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center justify-between">
            <span>Participants</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {participants.length} Assigned
            </span>
          </h4>

          <div className="space-y-2.5">
            {participants.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-xs ${p.iconBg}`}
                >
                  {p.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{p.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metadata Details Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
            Key Fields
          </h4>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {detailFields.map((field) => (
              <div
                key={field.key}
                className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/60 transition-colors text-xs"
              >
                <span className="text-slate-500 font-medium">{field.label}</span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <span className="truncate max-w-[140px]" title={String(field.value)}>
                    {field.value}
                  </span>
                  {field.copyable && (
                    <button
                      onClick={() => handleCopy(field.key, field.value)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                      title="Copy value"
                    >
                      {copiedKey === field.key ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System & Stage Pill */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            System Workspace
          </span>
          <span className="text-xs font-bold text-slate-800">
            {systemConfig?.title}
          </span>
        </div>
      </div>
    </div>
  );
}
