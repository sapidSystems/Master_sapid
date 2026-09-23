import React from "react";
import {
  Layers,
  Package,
  Boxes,
  ScrollText,
  TrendingUp,
  Database,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";
import KanbanCard from "./KanbanCard";
import supabase from "../../SupabaseClient";

// ----------------------------------------------------------------------
// Date & Status Helpers
// ----------------------------------------------------------------------
export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return dateStr;
  }
};

const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case "on-time":
    case "ontime":
      return { label: "On Time", color: "bg-emerald-100 text-emerald-700" };
    case "delayed":
    case "overdue":
      return { label: "Delayed", color: "bg-rose-100 text-rose-700" };
    case "completed":
    case "done":
      return { label: "Completed", color: "bg-blue-100 text-blue-700" };
    case "pending":
    default:
      return { label: "Pending", color: "bg-amber-100 text-amber-700" };
  }
};

export const getCardUrgencyStatus = ({
  targetDate,
  actualDate,
  isCompleted = false,
  fallbackStatus = "Active",
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let target = null;
  if (targetDate) {
    const d = new Date(targetDate);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      target = d;
    }
  }

  let actual = null;
  if (actualDate) {
    const d = new Date(actualDate);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      actual = d;
    }
  }

  // 1. Task is completed / done
  if (isCompleted) {
    if (target && actual) {
      if (actual > target) {
        const delayDays = Math.max(1, Math.round((actual.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)));
        return {
          label: `${delayDays}d delay`,
          statusColor: "bg-rose-100 text-rose-700 border border-rose-200",
          cardStyle: "border-2 border-rose-400 shadow-md shadow-rose-200/70 bg-white hover:border-rose-500",
          type: "delayed",
        };
      }
    }
    // Done on time -> Green
    return {
      label: "Done on time",
      statusColor: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      cardStyle: "border-2 border-emerald-400 shadow-md shadow-emerald-200/70 bg-white hover:border-emerald-500",
      type: "completed",
    };
  }

  // 2. Task not completed - check target date
  if (target) {
    const diffMs = target.getTime() - today.getTime();
    const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      // Delay (past target date) -> Red border & shadow
      const delayDays = Math.abs(daysDiff);
      return {
        label: `${delayDays}d delay`,
        statusColor: "bg-rose-100 text-rose-700 border border-rose-200",
        cardStyle: "border-2 border-rose-400 shadow-md shadow-rose-200/70 bg-white hover:border-rose-500",
        type: "delayed",
      };
    } else if (daysDiff <= 5) {
      // Within 5 days (0 to 5 days) -> Orange border & shadow
      const label = daysDiff === 0 ? "Due today" : `${daysDiff}d left`;
      return {
        label,
        statusColor: "bg-amber-100 text-amber-800 border border-amber-200",
        cardStyle: "border-2 border-amber-400 shadow-md shadow-amber-200/70 bg-white hover:border-amber-500",
        type: "near-due",
      };
    } else {
      // More than 5 days to be done -> White card (keep it as it is {white})
      return {
        label: `${daysDiff}d left`,
        statusColor: "bg-slate-100 text-slate-700 border border-slate-200",
        cardStyle: "bg-white border border-gray-200/90 shadow-xs hover:border-brand-300 hover:shadow-md",
        type: "normal",
      };
    }
  }

  // 3. Fallback when no target date exists
  return {
    label: fallbackStatus,
    statusColor: "bg-slate-100 text-slate-700 border border-slate-200",
    cardStyle: "bg-white border border-gray-200/90 shadow-xs hover:border-brand-300 hover:shadow-md",
    type: "normal",
  };
};

// ======================================================================
// 1. PROCUREMENT SYSTEM CONFIG
// ======================================================================
export const procurementConfig = {
  id: "procurement",
  title: "Procurement System",
  subtitle: "Track raw material, leather, and packaging supply pipelines",
  icon: Layers,
  badgeLabel: "Pending Orders",
  viewAllRoute: "/dashboard/procurement",

  columns: [
    {
      id: "new-leather",
      title: "New Leather Dev",
      subtitle: "Lab dip & sampling items",
      accentColor: "bg-blue-500",
      badgeBg: "bg-blue-100 text-blue-700",
      icon: Layers,
      emptyMessage: "No pending new leather development",
    },
    {
      id: "daily-leather",
      title: "Daily Leather Proc",
      subtitle: "Work order bulk hides",
      accentColor: "bg-indigo-500",
      badgeBg: "bg-indigo-100 text-indigo-700",
      icon: Package,
      emptyMessage: "No daily leather orders in transit",
    },
    {
      id: "material",
      title: "Daily Material Proc",
      subtitle: "Linings, hardware & thread",
      accentColor: "bg-purple-500",
      badgeBg: "bg-purple-100 text-purple-700",
      icon: Boxes,
      emptyMessage: "No material orders pending",
    },
    {
      id: "packaging",
      title: "Daily Packaging Proc",
      subtitle: "Shoe boxes, hangtags & cartons",
      accentColor: "bg-emerald-500",
      badgeBg: "bg-emerald-100 text-emerald-700",
      icon: ScrollText,
      emptyMessage: "No packaging orders pending",
    },
  ],

  getItemColumnId: (item) => item.module || "daily-leather",

  fetchItems: async () => {
    try {
      const [nlRes, dlRes, matRes, pkgRes] = await Promise.all([
        supabase.from("procurement_new_leather").select("*").order("created_at", { ascending: false }),
        supabase.from("procurement_daily_leather").select("*").order("created_at", { ascending: false }),
        supabase.from("procurement_material").select("*").order("created_at", { ascending: false }),
        supabase.from("procurement_packaging").select("*").order("created_at", { ascending: false }),
      ]);

      const items = [];

      (nlRes.data || []).forEach((row) => {
        items.push({
          id: row.id,
          module: "new-leather",
          title: row.leather_name || "New Leather",
          subtitle: `${row.buyer_code || "No Buyer"} • Tannery: ${row.tannery || "—"}`,
          status: row.status || (row.actual_receipt_date ? "completed" : "pending"),
          targetDate: row.target_receipt_date,
          actualDate: row.actual_receipt_date,
          colour: row.colour,
          quantity: row.quantity,
          unit: row.unit || "sqft",
          customer: row.buyer_code || "",
          vendor: row.tannery || "",
          raw: row,
        });
      });

      (dlRes.data || []).forEach((row) => {
        items.push({
          id: row.id,
          module: "daily-leather",
          title: `WO: ${row.wo_no || "—"}`,
          subtitle: `${row.buyer_code || "No Buyer"} • ${row.leather_name || "Leather"} (${row.tannery || "—"})`,
          status: row.status || (row.actual_receipt_date ? "completed" : "pending"),
          targetDate: row.target_receipt_date,
          actualDate: row.actual_receipt_date,
          colour: row.colour,
          quantity: row.quantity,
          unit: "sqft",
          customer: row.buyer_code || "",
          vendor: row.tannery || "",
          raw: row,
        });
      });

      (matRes.data || []).forEach((row) => {
        items.push({
          id: row.id,
          module: "material",
          title: `WO: ${row.wo_no || "—"} | ${row.material_name || "Material"}`,
          subtitle: `${row.buyer_code || "No Buyer"} • Supplier: ${row.supplier || "—"}`,
          status: row.status || (row.actual_receipt_date ? "completed" : "pending"),
          targetDate: row.target_receipt_date,
          actualDate: row.actual_receipt_date,
          quantity: row.quantity,
          unit: row.unit || "units",
          customer: row.buyer_code || "",
          vendor: row.supplier || "",
          raw: row,
        });
      });

      (pkgRes.data || []).forEach((row) => {
        items.push({
          id: row.id,
          module: "packaging",
          title: `WO: ${row.wo_no || "—"} | ${row.packaging_type || "Packaging"}`,
          subtitle: `${row.buyer_code || "No Buyer"} • Supplier: ${row.supplier || "—"}`,
          status: row.status || (row.actual_receipt_date ? "completed" : "pending"),
          targetDate: row.target_receipt_date,
          actualDate: row.actual_receipt_date,
          quantity: row.quantity,
          unit: row.unit || "pcs",
          customer: row.buyer_code || "",
          vendor: row.supplier || "",
          raw: row,
        });
      });

      // Also support localStorage cache if DB is empty
      if (items.length === 0) {
        try {
          const cachedNL = JSON.parse(localStorage.getItem("erp_new_leather") || "[]");
          const cachedDL = JSON.parse(localStorage.getItem("erp_daily_leather") || "[]");
          const cachedMat = JSON.parse(localStorage.getItem("erp_materials") || "[]");
          const cachedPkg = JSON.parse(localStorage.getItem("erp_packaging") || "[]");

          cachedNL.forEach((row) => {
            items.push({
              id: row.id,
              module: "new-leather",
              title: row.leatherName || "New Leather",
              subtitle: `${row.buyerCode || "No Buyer"} • Tannery: ${row.tannery || "—"}`,
              status: row.status || "pending",
              targetDate: row.targetReceiptDate,
              actualDate: row.actualReceiptDate,
              colour: row.colour,
              quantity: row.quantity,
              unit: row.unit || "sqft",
              raw: row,
            });
          });

          cachedDL.forEach((row) => {
            items.push({
              id: row.id,
              module: "daily-leather",
              title: `WO: ${row.woNo || "—"}`,
              subtitle: `${row.buyerCode || "No Buyer"} • ${row.leatherName || "Leather"}`,
              status: row.status || "pending",
              targetDate: row.targetReceiptDate,
              actualDate: row.actualReceiptDate,
              colour: row.colour,
              quantity: row.quantity,
              unit: "sqft",
              raw: row,
            });
          });

          cachedMat.forEach((row) => {
            items.push({
              id: row.id,
              module: "material",
              title: `WO: ${row.woNo || "—"} | ${row.materialName || "Material"}`,
              subtitle: `${row.buyerCode || "No Buyer"} • Supplier: ${row.supplier || "—"}`,
              status: row.status || "pending",
              targetDate: row.targetReceiptDate,
              actualDate: row.actualReceiptDate,
              quantity: row.quantity,
              unit: row.unit || "units",
              raw: row,
            });
          });

          cachedPkg.forEach((row) => {
            items.push({
              id: row.id,
              module: "packaging",
              title: `WO: ${row.woNo || "—"} | ${row.packagingType || "Packaging"}`,
              subtitle: `${row.buyerCode || "No Buyer"} • Supplier: ${row.supplier || "—"}`,
              status: row.status || "pending",
              targetDate: row.targetReceiptDate,
              actualDate: row.actualReceiptDate,
              quantity: row.quantity,
              unit: row.unit || "pcs",
              raw: row,
            });
          });
        } catch {}
      }

      return items;
    } catch (err) {
      console.error("Error fetching procurement items:", err);
      return [];
    }
  },

  renderCard: (item, columnId, navigate) => {
    const isCompleted = Boolean(item?.actualDate) || item?.status === "completed";
    const urgency = getCardUrgencyStatus({
      targetDate: item?.targetDate,
      actualDate: item?.actualDate,
      isCompleted,
      fallbackStatus: item?.status || "Pending",
    });
    const moduleName = (item?.module || columnId || "item").replace(/-/g, " ");

    return (
      <KanbanCard
        id={item?.id}
        title={item?.title || "Procurement Item"}
        subtitle={item?.subtitle || ""}
        badgeText={moduleName}
        status={urgency.label}
        statusColor={urgency.statusColor}
        cardStyle={urgency.cardStyle}
        datePrimary={formatDateDisplay(item?.targetDate)}
        dateSecondary={formatDateDisplay(item?.actualDate)}
        datePrimaryLabel="Target"
        dateSecondaryLabel="Actual"
        customSlot={
          (item?.colour || item?.quantity) ? (
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              {item?.colour && (
                <span>
                  Colour: <strong className="text-slate-800">{item.colour}</strong>
                </span>
              )}
              {item?.quantity && (
                <span>
                  Qty: <strong className="text-slate-800">{item.quantity} {item.unit || ""}</strong>
                </span>
              )}
            </div>
          ) : null
        }
        onClick={() => {
          if (navigate && item?.id) {
            navigate(`/dashboard/procurement/${item.id}`);
          }
        }}
      />
    );
  },
};

// ======================================================================
// 2. PRODUCTION PLANNING AND MONITORING CONFIG
// ======================================================================
const PRODUCTION_STAGES = [
  { id: "HANDOVER", title: "Handover", subtitle: "NPD / PPC Handover", color: "bg-sky-500", badgeBg: "bg-sky-100 text-sky-700" },
  { id: "LEATHER IN-HOUSE", title: "Leather In-House", subtitle: "Tannery leather ready", color: "bg-amber-500", badgeBg: "bg-amber-100 text-amber-700" },
  { id: "MATERIALS IN-HOUSE", title: "Materials In-House", subtitle: "Linings & hardware ready", color: "bg-violet-500", badgeBg: "bg-violet-100 text-violet-700" },
  { id: "PACKING MATERIALS IN-HOUSE", title: "Packing In-House", subtitle: "Cartons & boxes ready", color: "bg-indigo-500", badgeBg: "bg-indigo-100 text-indigo-700" },
  { id: "CUTTING COMPLETION", title: "Cutting", subtitle: "Cutting section completed", color: "bg-teal-500", badgeBg: "bg-teal-100 text-teal-700" },
  { id: "FABRICATION COMPLETION", title: "Fabrication", subtitle: "Stitching & assembly", color: "bg-orange-500", badgeBg: "bg-orange-100 text-orange-700" },
  { id: "QA COMPLETED", title: "QA Completed", subtitle: "Quality inspection passed", color: "bg-pink-500", badgeBg: "bg-pink-100 text-pink-700" },
  { id: "Planned Shipment", title: "Planned Shipment", subtitle: "Dispatch ready", color: "bg-emerald-500", badgeBg: "bg-emerald-100 text-emerald-700" },
];

export const productionConfig = {
  id: "production",
  title: "Production Planning & Monitoring",
  subtitle: "8-stage manufacturing milestone pipeline for bulk orders",
  icon: TrendingUp,
  badgeLabel: "Active Orders",
  viewAllRoute: "/dashboard/bulk-order",

  columns: PRODUCTION_STAGES.map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    accentColor: s.color,
    badgeBg: s.badgeBg,
    icon: TrendingUp,
    emptyMessage: `No orders in ${s.title}`,
  })),

  getItemColumnId: (item) => item.activeStage || "HANDOVER",

  fetchItems: async () => {
    try {
      const { data, error } = await supabase
        .from("sample_system_product_planning")
        .select("*")
        .eq("is_history", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((row) => {
        const stagesList = row.stages || [];
        let activeStage = "HANDOVER";
        let activeStageObj = null;

        // Find the first stage that does NOT have an actualDate
        for (const stg of stagesList) {
          if (!stg.actualDate) {
            activeStage = stg.name;
            activeStageObj = stg;
            break;
          }
        }

        // If all stages have actualDate, default to Planned Shipment
        if (!activeStageObj && stagesList.length > 0) {
          activeStage = "Planned Shipment";
          activeStageObj = stagesList[stagesList.length - 1];
        }

        const isDelayed =
          activeStageObj?.plannedDate &&
          new Date(activeStageObj.plannedDate) < new Date() &&
          !activeStageObj.actualDate;

        return {
          id: row.id,
          woNo: row.wo_no,
          buyer: row.buyer,
          qty: row.qty,
          woDate: row.wo_date,
          despatchDate: row.wo_despatch_date,
          activeStage,
          activeStageObj,
          isDelayed,
          addedBy: row.added_by,
          remarks: row.remarks,
          customer: row.buyer || "",
          vendor: row.vendor || row.supplier || "",
          targetDate: activeStageObj?.plannedDate || row.wo_despatch_date || null,
          raw: row,
        };
      });
    } catch (err) {
      console.error("Error fetching production planning items:", err);
      return [];
    }
  },

  renderCard: (item, columnId, navigate) => {
    const isCompleted =
      item?.raw?.is_history === true ||
      (item?.activeStage === "Planned Shipment" && Boolean(item?.activeStageObj?.actualDate));

    const targetDate = item?.activeStageObj?.plannedDate || item?.despatchDate;
    const actualDate = item?.activeStageObj?.actualDate;

    const urgency = getCardUrgencyStatus({
      targetDate,
      actualDate,
      isCompleted,
      fallbackStatus: isCompleted ? "Completed" : "In Progress",
    });

    return (
      <KanbanCard
        id={item?.id}
        title={`WO: ${item?.woNo || "—"}`}
        subtitle={`Buyer: ${item?.buyer || "—"}`}
        badgeText={item?.buyer || "WO"}
        status={urgency.label}
        statusColor={urgency.statusColor}
        cardStyle={urgency.cardStyle}
        datePrimary={formatDateDisplay(targetDate)}
        dateSecondary={formatDateDisplay(item?.woDate)}
        datePrimaryLabel="Target"
        dateSecondaryLabel="WO Date"
        assignee={item?.addedBy}
        metrics={[
          { label: "Quantity", value: `${item?.qty || 0} pcs` },
          { label: "Current Stage", value: item?.activeStage || columnId },
        ]}
        customSlot={
          (() => {
            const stagesList = item?.raw?.stages || [];
            const stagesWithRemarks = stagesList.filter(s => s?.remarks && String(s.remarks).trim());
            const latestStageRemark = stagesWithRemarks.length > 0 ? stagesWithRemarks[stagesWithRemarks.length - 1] : null;
            const remarkText = latestStageRemark?.remarks || item?.remarks;
            const remarkLocation = latestStageRemark?.name || (item?.remarks ? 'W/O Notes' : null);

            if (!remarkText) return null;

            return (
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-1.5 flex items-start gap-1.5 mt-0.5">
                <span className="shrink-0 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[9px] font-bold uppercase tracking-tight">
                  {remarkLocation}
                </span>
                <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                  "{remarkText}"
                </p>
              </div>
            );
          })()
        }
        onClick={() => {
          if (navigate && item?.id) {
            navigate(`/dashboard/production/${item.id}`);
          }
        }}
      />
    );
  },
};

// ======================================================================
// 3. SAMPLE SYSTEM CONFIG
// ======================================================================
export const sampleConfig = {
  id: "sample",
  title: "Sample System",
  subtitle: "Development enquiries, sampling lifecycle, and approval workflows",
  icon: Database,
  badgeLabel: "Pending Samples",
  viewAllRoute: "/dashboard/sample-management",

  columns: [
    {
      id: "enquiry",
      title: "Enquiry Received",
      subtitle: "New sample requests",
      accentColor: "bg-blue-500",
      badgeBg: "bg-blue-100 text-blue-700",
      icon: Database,
      emptyMessage: "No newly received enquiries",
    },
    {
      id: "handover",
      title: "Handover to NPD",
      subtitle: "Sampling work order issued",
      accentColor: "bg-indigo-500",
      badgeBg: "bg-indigo-100 text-indigo-700",
      icon: FileText,
      emptyMessage: "No samples pending handover",
    },
    {
      id: "ready",
      title: "Completed / Ready",
      subtitle: "Awaiting dispatch to buyer",
      accentColor: "bg-emerald-500",
      badgeBg: "bg-emerald-100 text-emerald-700",
      icon: CheckCircle2,
      emptyMessage: "No completed samples awaiting dispatch",
    },
    {
      id: "dispatched",
      title: "Dispatched / Closed",
      subtitle: "Shipped samples history",
      accentColor: "bg-slate-500",
      badgeBg: "bg-slate-200 text-slate-700",
      icon: CheckCircle2,
      emptyMessage: "No dispatched records",
    },
  ],

  getItemColumnId: (item) => {
    if (item?.dispatchSentDate) return "dispatched";
    if (item?.actualCompletionDate) return "ready";
    if (item?.sampleWOHandoverDate || item?.expectedCompletionDate) return "handover";
    return "enquiry";
  },

  fetchItems: async () => {
    try {
      const { data, error } = await supabase
        .from("sample_system_sample_management")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((row) => {
        let stage = "enquiry";
        if (row.dispatch_sent_date) stage = "dispatched";
        else if (row.actual_completion_date) stage = "ready";
        else if (row.sample_wo_handover_date || row.expected_completion_date) stage = "handover";

        const isDelayed =
          row.requirement_date &&
          new Date(row.requirement_date) < new Date() &&
          !row.dispatch_sent_date;

        return {
          id: row.id,
          sampleWONo: row.sample_wo_no,
          buyerCoder: row.buyer_coder,
          productName: row.product_name,
          qty: row.qty,
          type: row.type,
          receiptDate: row.receipt_date,
          requirementDate: row.requirement_date,
          sampleWOHandoverDate: row.sample_wo_handover_date,
          expectedCompletionDate: row.expected_completion_date,
          actualCompletionDate: row.actual_completion_date,
          dispatchSentDate: row.dispatch_sent_date,
          stage,
          isDelayed,
          addedBy: row.added_by,
          remarks: row.remarks,
          customer: row.buyer_coder || "",
          vendor: row.vendor || row.supplier || "",
          targetDate: row.requirement_date || row.expected_completion_date || null,
          raw: row,
        };
      });
    } catch (err) {
      console.error("Error fetching sample system items:", err);
      return [];
    }
  },

  renderCard: (item, columnId, navigate) => {
    const isCompleted =
      Boolean(item?.dispatchSentDate) ||
      (item?.stage === "ready" && Boolean(item?.actualCompletionDate));

    const targetDate = item?.requirementDate || item?.expectedCompletionDate;
    const actualDate = item?.dispatchSentDate || item?.actualCompletionDate;

    const urgency = getCardUrgencyStatus({
      targetDate,
      actualDate,
      isCompleted,
      fallbackStatus: isCompleted ? "Completed" : "Active",
    });

    return (
      <KanbanCard
        id={item?.id}
        title={item?.sampleWONo || item?.productName || "Sample WO"}
        subtitle={`${item?.buyerCoder || "No Buyer"} • ${item?.productName || "Item"}`}
        badgeText={item?.type || "Sample"}
        status={urgency.label}
        statusColor={urgency.statusColor}
        cardStyle={urgency.cardStyle}
        datePrimary={formatDateDisplay(targetDate)}
        dateSecondary={formatDateDisplay(item?.receiptDate)}
        datePrimaryLabel="Req Date"
        dateSecondaryLabel="Received"
        assignee={item?.addedBy}
        metrics={[
          { label: "Quantity", value: `${item?.qty || 1} pcs` },
          { label: "Sample Type", value: item?.type || "Standard" },
        ]}
        customSlot={
          item?.remarks ? (
            <p className="text-[11px] text-slate-500 line-clamp-1 italic">
              "{item.remarks}"
            </p>
          ) : null
        }
        onClick={() => {
          if (navigate && item?.id) {
            navigate(`/dashboard/sample/${item.id}`);
          }
        }}
      />
    );
  },
};

// ======================================================================
// 4. CHECKLIST SYSTEM CONFIG
// ======================================================================
export const checklistConfig = {
  id: "checklist",
  title: "Checklist System",
  subtitle: "Routine operations, maintenance tasks, repair requests & delegations",
  icon: ClipboardList,
  badgeLabel: "Pending Tasks",
  viewAllRoute: "/dashboard/task",

  columns: [
    {
      id: "today",
      title: "Due Today",
      subtitle: "Tasks due for completion today",
      accentColor: "bg-amber-500",
      badgeBg: "bg-amber-100 text-amber-700",
      icon: Clock,
      emptyMessage: "No tasks due today",
    },
    {
      id: "pending",
      title: "Upcoming / Scheduled",
      subtitle: "Planned for future dates",
      accentColor: "bg-sky-500",
      badgeBg: "bg-sky-100 text-sky-700",
      icon: ClipboardList,
      emptyMessage: "No upcoming scheduled tasks",
    },
    {
      id: "overdue",
      title: "Overdue / Delayed",
      subtitle: "Missed planned date",
      accentColor: "bg-rose-500",
      badgeBg: "bg-rose-100 text-rose-700",
      icon: AlertTriangle,
      emptyMessage: "No overdue tasks",
    },
    {
      id: "approval",
      title: "Awaiting Approval",
      subtitle: "Submitted, waiting for review",
      accentColor: "bg-purple-500",
      badgeBg: "bg-purple-100 text-purple-700",
      icon: FileText,
      emptyMessage: "No approvals pending",
    },
    {
      id: "completed",
      title: "Completed / Approved",
      subtitle: "Verified tasks",
      accentColor: "bg-emerald-500",
      badgeBg: "bg-emerald-100 text-emerald-700",
      icon: CheckCircle2,
      emptyMessage: "No completed tasks to display",
    },
  ],

  getItemColumnId: (item) => item?.stage || "pending",

  fetchItems: async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch checklist tasks
      const { data: chkData, error: chkErr } = await supabase
        .from("checklist")
        .select("*")
        .order("planned_date", { ascending: false })
        .limit(100);

      if (chkErr) throw chkErr;

      return (chkData || []).map((row) => {
        let stage = "pending";
        const plannedDate = row.planned_date ? new Date(row.planned_date) : null;
        if (plannedDate) plannedDate.setHours(0, 0, 0, 0);

        if (row.submission_date) {
          if (row.admin_done) {
            stage = "completed";
          } else {
            stage = "approval";
          }
        } else if (plannedDate) {
          if (plannedDate.getTime() === today.getTime()) {
            stage = "today";
          } else if (plannedDate < today) {
            stage = "overdue";
          } else {
            stage = "pending";
          }
        }

        return {
          id: row.task_id || row.id,
          task_id: row.task_id,
          taskDescription: row.task_description,
          department: row.department,
          name: row.name,
          givenBy: row.given_by,
          plannedDate: row.planned_date,
          submissionDate: row.submission_date,
          status: row.status,
          stage,
          customer: row.department || row.name || "",
          vendor: row.given_by || "",
          targetDate: row.planned_date || null,
          raw: row,
        };
      });
    } catch (err) {
      console.error("Error fetching checklist items:", err);
      return [];
    }
  },

  renderCard: (item, columnId, navigate) => {
    const isCompleted = Boolean(item?.raw?.admin_done || (item?.submissionDate && item?.status === "yes"));
    const urgency = getCardUrgencyStatus({
      targetDate: item?.plannedDate,
      actualDate: item?.submissionDate,
      isCompleted,
      fallbackStatus: item?.stage === "approval" ? "Review" : "Pending",
    });

    return (
      <KanbanCard
        id={item?.id}
        title={item?.taskDescription || "Checklist Task"}
        subtitle={`${item?.department || "Operations"} • Assigned by: ${item?.givenBy || "Admin"}`}
        badgeText={item?.department || "TASK"}
        status={urgency.label}
        statusColor={urgency.statusColor}
        cardStyle={urgency.cardStyle}
        datePrimary={formatDateDisplay(item?.plannedDate)}
        dateSecondary={formatDateDisplay(item?.submissionDate)}
        datePrimaryLabel="Planned"
        dateSecondaryLabel="Submitted"
        assignee={item?.name}
        onClick={() => {
          if (navigate) {
            const recId = item?.task_id || item?.id;
            if (recId) navigate(`/dashboard/checklist/${recId}`);
          }
        }}
      />
    );
  },
};

export const ALL_SYSTEM_CONFIGS = {
  checklist: checklistConfig,
  sample: sampleConfig,
  production: productionConfig,
  procurement: procurementConfig,
};
