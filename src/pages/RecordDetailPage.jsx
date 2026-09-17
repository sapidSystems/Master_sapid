import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout";
import DetailHeader from "../components/detail/DetailHeader";
import DetailSidebar from "../components/detail/DetailSidebar";
import OverviewTab from "../components/detail/OverviewTab";
import PlanTab from "../components/detail/PlanTab";
import NotesTab from "../components/detail/NotesTab";
import FilesTab from "../components/detail/FilesTab";
import { ALL_SYSTEM_CONFIGS } from "../components/kanban/systemConfigs";
import supabase from "../SupabaseClient";
import { useMagicToast } from "../context/MagicToastContext";
import {
  Layers,
  Calendar,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  ListTodo,
} from "lucide-react";

export default function RecordDetailPage() {
  const { systemId, recordId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useMagicToast();

  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'plan' | 'notes' | 'files'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [record, setRecord] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const systemConfig = ALL_SYSTEM_CONFIGS[systemId] || ALL_SYSTEM_CONFIGS.checklist;

  // --------------------------------------------------------------------
  // 1. Fetch record data based on systemId
  // --------------------------------------------------------------------
  const fetchRecordData = useCallback(async () => {
    try {
      setIsLoading(true);

      if (systemId === "procurement") {
        // Search across the 4 procurement tables
        const [nlRes, dlRes, matRes, pkgRes] = await Promise.all([
          supabase.from("procurement_new_leather").select("*").or(`id.eq.${recordId},wo_no.eq.${recordId}`).maybeSingle(),
          supabase.from("procurement_daily_leather").select("*").or(`id.eq.${recordId},wo_no.eq.${recordId}`).maybeSingle(),
          supabase.from("procurement_material").select("*").or(`id.eq.${recordId},wo_no.eq.${recordId}`).maybeSingle(),
          supabase.from("procurement_packaging").select("*").or(`id.eq.${recordId},wo_no.eq.${recordId}`).maybeSingle(),
        ]);

        let rawRow = nlRes.data || dlRes.data || matRes.data || pkgRes.data;
        let foundModule = nlRes.data ? "new-leather" : dlRes.data ? "daily-leather" : matRes.data ? "material" : "packaging";
        let tableName = nlRes.data
          ? "procurement_new_leather"
          : dlRes.data
          ? "procurement_daily_leather"
          : matRes.data
          ? "procurement_material"
          : "procurement_packaging";

        // Fallback to localStorage if not found in database
        if (!rawRow) {
          const tryLocal = (key, mod) => {
            try {
              const list = JSON.parse(localStorage.getItem(key) || "[]");
              return list.find((i) => String(i.id) === String(recordId) || String(i.woNo) === String(recordId));
            } catch {
              return null;
            }
          };
          rawRow =
            tryLocal("erp_daily_leather", "daily-leather") ||
            tryLocal("erp_new_leather", "new-leather") ||
            tryLocal("erp_materials", "material") ||
            tryLocal("erp_packaging", "packaging");
        }

        if (!rawRow) {
          showToast("Record not found", "error");
          setIsLoading(false);
          return;
        }

        const isCompleted = Boolean(rawRow.actual_receipt_date || rawRow.actualReceiptDate || rawRow.status === "completed");
        const targetDate = rawRow.target_receipt_date || rawRow.targetReceiptDate;
        const isDelayed = !isCompleted && targetDate && new Date(targetDate) < new Date();

        const formattedRecord = {
          id: rawRow.id,
          tableName,
          module: rawRow.module || foundModule,
          woNo: rawRow.wo_no || rawRow.woNo || rawRow.leather_name || rawRow.leatherName,
          title: rawRow.leather_name || rawRow.leatherName || rawRow.material_name || rawRow.materialName || rawRow.packaging_type || rawRow.packagingType || "Procurement Item",
          buyer: rawRow.buyer_code || rawRow.buyerCode,
          tannery: rawRow.tannery,
          supplier: rawRow.supplier,
          colour: rawRow.colour,
          quantity: rawRow.quantity,
          unit: rawRow.unit,
          date: rawRow.date,
          targetReceiptDate: targetDate,
          actualReceiptDate: rawRow.actual_receipt_date || rawRow.actualReceiptDate,
          owner: rawRow.tannery || rawRow.supplier || "Procurement Team",
          isCompleted,
          isDelayed,
          raw: rawRow,
        };

        // Construct milestones for Procurement
        let ms = [];
        if (formattedRecord.module === "daily-leather") {
          ms = [
            {
              id: "indent",
              stageId: "daily-leather",
              stageName: "Daily Leather Proc",
              name: "Work Order & Indent Receipt",
              plannedDate: rawRow.indent_receipt_date || rawRow.indentReceiptDate || rawRow.date,
              actualDate: rawRow.indent_receipt_date || rawRow.indentReceiptDate || rawRow.date,
              isCompleted: true,
              assignee: rawRow.buyer_code || "NPD",
            },
            {
              id: "po_release",
              stageId: "daily-leather",
              stageName: "Daily Leather Proc",
              name: "Purchase Order (PO) Release",
              plannedDate: rawRow.po_release_target_date || rawRow.poReleaseTargetDate,
              actualDate: rawRow.actual_po_release_date || rawRow.actualPoReleaseDate,
              isCompleted: Boolean(rawRow.actual_po_release_date || rawRow.actualPoReleaseDate),
              assignee: "Procurement",
            },
            {
              id: "delivery",
              stageId: "daily-leather",
              stageName: "Daily Leather Proc",
              name: "Tannery Bulk Delivery",
              plannedDate: rawRow.planned_delivery_date || rawRow.plannedDeliveryDate || rawRow.po_delivery_date,
              actualDate: rawRow.po_delivery_date || rawRow.poDeliveryDate,
              isCompleted: Boolean(rawRow.po_delivery_date || rawRow.poDeliveryDate),
              assignee: rawRow.tannery || "Tannery",
            },
            {
              id: "receipt",
              stageId: "daily-leather",
              stageName: "Daily Leather Proc",
              name: "Final In-House Receipt & Inspection",
              plannedDate: targetDate,
              actualDate: rawRow.actual_receipt_date || rawRow.actualReceiptDate,
              isCompleted: isCompleted,
              assignee: "Stores / QC",
            },
          ];
        } else if (formattedRecord.module === "material" || formattedRecord.module === "packaging") {
          const stgName = formattedRecord.module === "packaging" ? "Daily Packaging Proc" : "Daily Material Proc";
          ms = [
            {
              id: "indent",
              stageId: formattedRecord.module,
              stageName: stgName,
              name: "Indent Receipt from Production",
              plannedDate: rawRow.indent_receipt_date || rawRow.indentReceiptDate || rawRow.date,
              actualDate: rawRow.indent_receipt_date || rawRow.indentReceiptDate || rawRow.date,
              isCompleted: true,
              assignee: "PPC",
            },
            {
              id: "stock_check",
              stageId: formattedRecord.module,
              stageName: stgName,
              name: "Store Stock Check Verification",
              plannedDate: rawRow.target_stock_check_date || rawRow.targetStockCheckDate,
              actualDate: rawRow.actual_stock_update_date || rawRow.actualStockUpdateDate,
              isCompleted: Boolean(rawRow.actual_stock_update_date || rawRow.actualStockUpdateDate),
              assignee: "Store Keeper",
            },
            {
              id: "po_release",
              stageId: formattedRecord.module,
              stageName: stgName,
              name: "Supplier Purchase Order Release",
              plannedDate: rawRow.po_release_target_date || rawRow.poReleaseTargetDate,
              actualDate: rawRow.actual_po_release_date || rawRow.actualPoReleaseDate,
              isCompleted: Boolean(rawRow.actual_po_release_date || rawRow.actualPoReleaseDate),
              assignee: "Procurement",
            },
            {
              id: "final_receipt",
              stageId: formattedRecord.module,
              stageName: stgName,
              name: "Final Delivery & In-House Receipt",
              plannedDate: targetDate,
              actualDate: rawRow.actual_receipt_date || rawRow.actualReceiptDate,
              isCompleted: isCompleted,
              assignee: "QC",
            },
          ];
        } else {
          // New Leather Dev
          ms = [
            {
              id: "nl_dev",
              stageId: "new-leather",
              stageName: "New Leather Dev",
              name: "Development Sample Creation",
              plannedDate: rawRow.date,
              actualDate: rawRow.date,
              isCompleted: true,
              assignee: rawRow.tannery || "Tannery",
            },
            {
              id: "nl_labdip",
              stageId: "new-leather",
              stageName: "New Leather Dev",
              name: "Lab Dip & Swatch Approval",
              plannedDate: targetDate,
              actualDate: rawRow.actual_receipt_date || rawRow.actualReceiptDate,
              isCompleted: isCompleted,
              assignee: rawRow.buyer_code || "Buyer",
            },
          ];
        }

        setRecord(formattedRecord);
        setMilestones(ms);

        // Notes from remark_history
        const rawRemarks = rawRow.remark_history || rawRow.remarkHistory || [];
        const parsedNotes = Array.isArray(rawRemarks)
          ? [...rawRemarks].reverse()
          : [];
        if (rawRow.remarks) {
          parsedNotes.push({
            id: "initial_remark",
            text: rawRow.remarks,
            author: "System",
            timestamp: rawRow.created_at,
          });
        }
        setNotes(parsedNotes);
      } else if (systemId === "production") {
        // Query sample_system_product_planning
        const { data: ppRow, error: ppErr } = await supabase
          .from("sample_system_product_planning")
          .select("*")
          .or(`id.eq.${recordId},wo_no.eq.${recordId}`)
          .maybeSingle();

        if (ppErr || !ppRow) {
          showToast("Production Order not found", "error");
          setIsLoading(false);
          return;
        }

        const stagesList = ppRow.stages || [];
        const isCompleted = ppRow.is_history === true;
        const isDelayed =
          !isCompleted &&
          ppRow.wo_despatch_date &&
          new Date(ppRow.wo_despatch_date) < new Date();

        const formattedRecord = {
          id: ppRow.id,
          woNo: ppRow.wo_no,
          title: `Work Order ${ppRow.wo_no}`,
          buyer: ppRow.buyer,
          qty: ppRow.qty,
          woDate: ppRow.wo_date,
          despatchDate: ppRow.wo_despatch_date,
          currentStage: ppRow.current_stage,
          isCompleted,
          isDelayed,
          owner: ppRow.added_by || "PPC Lead",
          addedBy: ppRow.added_by,
          raw: ppRow,
        };

        const ms = stagesList.map((stg, idx) => ({
          id: `stage_${idx}`,
          stageId: stg.name,
          stageName: stg.name,
          name: stg.name,
          plannedDate: stg.plannedDate,
          actualDate: stg.actualDate,
          remarks: stg.remarks,
          isCompleted: Boolean(stg.actualDate) || isCompleted,
          assignee: ppRow.added_by || "PPC",
        }));

        setRecord(formattedRecord);
        setMilestones(ms);

        const notesList = [];
        if (ppRow.remarks) {
          notesList.push({
            id: "main_remarks",
            text: ppRow.remarks,
            author: ppRow.added_by || "PPC",
            timestamp: ppRow.created_at,
          });
        }
        stagesList.forEach((s, idx) => {
          if (s.remarks) {
            notesList.push({
              id: `stage_rem_${idx}`,
              text: `[${s.name}] ${s.remarks}`,
              author: "Stage Lead",
              timestamp: s.actualDate || s.plannedDate,
            });
          }
        });
        setNotes(notesList);
      } else if (systemId === "sample") {
        // Query sample_system_sample_management
        const { data: smRow, error: smErr } = await supabase
          .from("sample_system_sample_management")
          .select("*")
          .or(`id.eq.${recordId},sample_wo_no.eq.${recordId}`)
          .maybeSingle();

        if (smErr || !smRow) {
          showToast("Sample Record not found", "error");
          setIsLoading(false);
          return;
        }

        const isCompleted = Boolean(smRow.dispatch_sent_date);
        const isDelayed =
          !isCompleted &&
          smRow.requirement_date &&
          new Date(smRow.requirement_date) < new Date();

        const formattedRecord = {
          id: smRow.id,
          sampleWONo: smRow.sample_wo_no,
          woNo: smRow.sample_wo_no,
          title: smRow.product_name || `Sample ${smRow.sample_wo_no}`,
          productName: smRow.product_name,
          buyerCoder: smRow.buyer_coder,
          buyer: smRow.buyer_coder,
          qty: smRow.qty,
          type: smRow.type,
          receiptDate: smRow.receipt_date,
          requirementDate: smRow.requirement_date,
          owner: smRow.added_by || "NPD Lead",
          addedBy: smRow.added_by,
          isCompleted,
          isDelayed,
          raw: smRow,
        };

        const ms = [
          {
            id: "enquiry_recv",
            stageId: "enquiry",
            stageName: "Enquiry Received",
            name: "Sampling Enquiry Received from Buyer",
            plannedDate: smRow.receipt_date,
            actualDate: smRow.receipt_date,
            isCompleted: true,
            assignee: smRow.added_by,
          },
          {
            id: "handover_npd",
            stageId: "handover",
            stageName: "Handover to NPD",
            name: "Sample WO Handover to NPD Team",
            plannedDate: smRow.sample_wo_handover_date,
            actualDate: smRow.sample_wo_handover_date,
            isCompleted: Boolean(smRow.sample_wo_handover_date),
            assignee: "NPD",
          },
          {
            id: "dev_progress",
            stageId: "in_progress",
            stageName: "In Development",
            name: "Pattern & Upper Development Completion",
            plannedDate: smRow.expected_completion_date,
            actualDate: smRow.actual_completion_date,
            isCompleted: Boolean(smRow.actual_completion_date),
            assignee: "Pattern Maker",
          },
          {
            id: "sample_ready",
            stageId: "ready",
            stageName: "Completed / Ready",
            name: "Final Sample Inspection & Packing",
            plannedDate: smRow.requirement_date,
            actualDate: smRow.actual_completion_date,
            isCompleted: Boolean(smRow.actual_completion_date),
            assignee: "QC",
          },
          {
            id: "dispatch_closed",
            stageId: "dispatched",
            stageName: "Dispatched / Closed",
            name: "Courier Dispatch & AWB Generation",
            plannedDate: smRow.requirement_date,
            actualDate: smRow.dispatch_sent_date,
            isCompleted: isCompleted,
            assignee: "Logistics",
          },
        ];

        setRecord(formattedRecord);
        setMilestones(ms);

        const notesList = [];
        if (smRow.remarks) {
          notesList.push({
            id: "sample_note",
            text: smRow.remarks,
            author: smRow.added_by || "NPD Lead",
            timestamp: smRow.created_at,
          });
        }
        setNotes(notesList);
      } else {
        // systemId === 'checklist'
        const { data: chkRow, error: chkErr } = await supabase
          .from("checklist")
          .select("*")
          .or(`task_id.eq.${recordId},id.eq.${recordId}`)
          .maybeSingle();

        if (chkErr || !chkRow) {
          showToast("Task not found in Checklist", "error");
          setIsLoading(false);
          return;
        }

        const isCompleted = Boolean(chkRow.admin_done || (chkRow.submission_date && chkRow.status === "yes"));
        const isDelayed =
          !isCompleted && chkRow.planned_date && new Date(chkRow.planned_date) < new Date();

        const formattedRecord = {
          id: chkRow.task_id || chkRow.id,
          task_id: chkRow.task_id,
          title: chkRow.task_description || `Task #${chkRow.task_id}`,
          taskDescription: chkRow.task_description,
          department: chkRow.department,
          name: chkRow.name,
          given_by: chkRow.given_by,
          owner: chkRow.name || "Assignee",
          planned_date: chkRow.planned_date,
          submission_date: chkRow.submission_date,
          image: chkRow.image,
          audio_url: chkRow.audio_url,
          instruction_attachment_url: chkRow.instruction_attachment_url,
          instruction_attachment_type: chkRow.instruction_attachment_type,
          isCompleted,
          isDelayed,
          raw: chkRow,
        };

        const ms = [
          {
            id: "scheduled",
            stageId: "pending",
            stageName: "Upcoming / Scheduled",
            name: "Task Assignment & Scheduling",
            plannedDate: chkRow.planned_date,
            actualDate: chkRow.planned_date,
            isCompleted: true,
            assignee: chkRow.given_by,
          },
          {
            id: "submission",
            stageId: "today",
            stageName: "Due Today",
            name: "Operational Task Execution & Proof Submission",
            plannedDate: chkRow.planned_date,
            actualDate: chkRow.submission_date,
            isCompleted: Boolean(chkRow.submission_date),
            assignee: chkRow.name,
          },
          {
            id: "approval",
            stageId: "approval",
            stageName: "Awaiting Approval",
            name: "HOD / Admin Quality Approval & Sign-Off",
            plannedDate: chkRow.planned_date,
            actualDate: chkRow.admin_approval_date,
            isCompleted: isCompleted,
            assignee: chkRow.given_by || "Admin",
          },
        ];

        setRecord(formattedRecord);
        setMilestones(ms);

        const notesList = [];
        if (chkRow.remark) {
          notesList.push({
            id: "chk_remark",
            text: chkRow.remark,
            author: chkRow.name || "Doer",
            timestamp: chkRow.submission_date || chkRow.created_at,
          });
        }
        setNotes(notesList);
      }
    } catch (err) {
      console.error("Error loading record details:", err);
      showToast("Error loading record details", "error");
    } finally {
      setIsLoading(false);
    }
  }, [systemId, recordId, showToast]);

  useEffect(() => {
    fetchRecordData();
  }, [fetchRecordData]);

  // --------------------------------------------------------------------
  // 2. Status change action handler (Complete vs Reopen)
  // --------------------------------------------------------------------
  const handleStatusChange = async (action) => {
    if (!record) return;
    try {
      setIsUpdating(true);
      const isComplete = action === "complete";
      const todayStr = new Date().toISOString().split("T")[0];

      if (systemId === "procurement") {
        const table = record.tableName || "procurement_daily_leather";
        const updates = {
          actual_receipt_date: isComplete ? todayStr : null,
          status: isComplete ? "completed" : "pending",
        };

        const { error } = await supabase
          .from(table)
          .update(updates)
          .eq("id", record.id);

        if (error) throw error;
        window.dispatchEvent(new CustomEvent("procurement-updated"));
      } else if (systemId === "production") {
        const { error } = await supabase
          .from("sample_system_product_planning")
          .update({
            is_history: isComplete,
            history_timestamp: isComplete ? new Date().toISOString() : null,
          })
          .eq("id", record.id);

        if (error) throw error;
      } else if (systemId === "sample") {
        const { error } = await supabase
          .from("sample_system_sample_management")
          .update({
            dispatch_sent_date: isComplete ? todayStr : null,
          })
          .eq("id", record.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("checklist")
          .update({
            admin_done: isComplete,
            submission_date: isComplete ? new Date().toISOString() : null,
          })
          .eq("task_id", record.id);

        if (error) throw error;
      }

      showToast(`Record ${isComplete ? "marked as completed" : "reopened"} successfully!`, "success");
      await fetchRecordData();
    } catch (err) {
      console.error("Error changing status:", err);
      showToast("Failed to update status", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // --------------------------------------------------------------------
  // 3. Milestone toggle handler
  // --------------------------------------------------------------------
  const handleToggleMilestone = async (milestoneId) => {
    const targetMilestone = milestones.find((m) => m.id === milestoneId);
    if (!targetMilestone) return;

    const willBeDone = !targetMilestone.isCompleted;
    const todayStr = new Date().toISOString().split("T")[0];

    // Optimistically update UI
    setMilestones((prev) =>
      prev.map((m) => (m.id === milestoneId ? { ...m, isCompleted: willBeDone, actualDate: willBeDone ? todayStr : null } : m))
    );

    try {
      if (systemId === "production" && record?.raw?.stages) {
        const updatedStages = record.raw.stages.map((s) => {
          if (s.name === targetMilestone.name) {
            return { ...s, actualDate: willBeDone ? todayStr : "" };
          }
          return s;
        });

        await supabase
          .from("sample_system_product_planning")
          .update({ stages: updatedStages })
          .eq("id", record.id);
      }
      showToast(`Milestone ${willBeDone ? "completed" : "marked open"}!`, "success");
    } catch (err) {
      console.error("Error toggling milestone:", err);
    }
  };

  // --------------------------------------------------------------------
  // 4. Add Note handler
  // --------------------------------------------------------------------
  const handleAddNote = async (text) => {
    try {
      setIsAddingNote(true);
      const currentUser = localStorage.getItem("user-name") || "Admin";
      const newEntry = {
        id: `note_${Date.now()}`,
        text,
        author: currentUser,
        timestamp: new Date().toISOString(),
      };

      if (systemId === "procurement") {
        const table = record.tableName || "procurement_daily_leather";
        const currentHistory = record.raw?.remark_history || record.raw?.remarkHistory || [];
        const updatedHistory = [...currentHistory, newEntry];

        await supabase.from(table).update({ remark_history: updatedHistory }).eq("id", record.id);
      } else if (systemId === "production") {
        await supabase
          .from("sample_system_product_planning")
          .update({ remarks: text })
          .eq("id", record.id);
      } else if (systemId === "sample") {
        await supabase
          .from("sample_system_sample_management")
          .update({ remarks: text })
          .eq("id", record.id);
      } else {
        await supabase
          .from("checklist")
          .update({ remark: text })
          .eq("task_id", record.id);
      }

      setNotes((prev) => [newEntry, ...prev]);
      showToast("Comment posted successfully!", "success");
      return true;
    } catch (err) {
      console.error("Error adding note:", err);
      showToast("Failed to post note", "error");
      return false;
    } finally {
      setIsAddingNote(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-xs font-semibold">Loading record details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!record) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-slate-500 text-xs max-w-md mx-auto">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Record Not Found</h3>
          <p className="mb-4">The requested record identifier does not exist or has been removed.</p>
          <button
            onClick={() => navigate(`/dashboard?system=${systemId}`)}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl font-bold"
          >
            Back to Dashboard
          </button>
        </div>
      </AdminLayout>
    );
  }

  const hasFilesTab = Boolean(record.image || record.audio_url || record.instruction_attachment_url || systemId === "checklist");

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-screen bg-slate-50/50">
        {/* Step 1: Pipedrive-Style Header */}
        <DetailHeader
          record={record}
          systemConfig={systemConfig}
          systemId={systemId}
          onBack={() => navigate(`/dashboard?system=${systemId}`)}
          onStatusChange={handleStatusChange}
          isUpdating={isUpdating}
        />

        {/* Content Layout with Collapsible Left Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Collapsible Left Sidebar */}
          <DetailSidebar
            record={record}
            systemConfig={systemConfig}
            systemId={systemId}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          {/* Main Area: Top Tabs & Active Tab Panel */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Step 2: Tabs Across Top */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "overview"
                    ? "border-brand-600 text-brand-700 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab("plan")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "plan"
                    ? "border-brand-600 text-brand-700 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <ListTodo className="w-3.5 h-3.5" />
                <span>Plan & Milestones</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                  {milestones.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("notes")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "notes"
                    ? "border-brand-600 text-brand-700 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Notes & Remarks</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                  {notes.length}
                </span>
              </button>

              {hasFilesTab && (
                <button
                  onClick={() => setActiveTab("files")}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === "files"
                      ? "border-brand-600 text-brand-700 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Files & Media</span>
                </button>
              )}
            </div>

            {/* Active Tab Content Area */}
            <div>
              {activeTab === "overview" && (
                <OverviewTab
                  record={record}
                  milestones={milestones}
                  onToggleMilestone={handleToggleMilestone}
                  systemConfig={systemConfig}
                />
              )}

              {activeTab === "plan" && (
                <PlanTab
                  record={record}
                  systemConfig={systemConfig}
                  stages={systemConfig.columns}
                  milestones={milestones}
                  onToggleMilestone={handleToggleMilestone}
                />
              )}

              {activeTab === "notes" && (
                <NotesTab
                  record={record}
                  notes={notes}
                  onAddNote={handleAddNote}
                  isAdding={isAddingNote}
                  systemConfig={systemConfig}
                  systemId={systemId}
                />
              )}

              {activeTab === "files" && hasFilesTab && (
                <FilesTab record={record} />
              )}
            </div>
          </main>
        </div>
      </div>
    </AdminLayout>
  );
}
