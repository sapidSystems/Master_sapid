import { useState, useEffect, useCallback, useRef } from "react";
import supabase from "../SupabaseClient";

const DEFAULT_COUNTS = {
  quickTask: 0,
  delegation: 0,
  task: 0,
  adminApproval: 0,
  sampleManagement: 0,
  productionPlanning: 0,
  productionApproval: 0,
  productionMonitoring: 0,
  procurementNewLeather: 0,
  procurementDailyLeather: 0,
  procurementMaterial: 0,
};

// Module-level cache to persist counts across unmount/remount on navigation
let cachedCounts = null;
let lastFetchTime = 0;
export const CACHE_TTL = 30000; // 30 seconds

export function useUnifiedCounts(userParam, roleParam) {
  const [menuCounts, setMenuCounts] = useState(cachedCounts || DEFAULT_COUNTS);
  const [loading, setLoading] = useState(!cachedCounts);
  const isFetchingRef = useRef(false);

  const fetchCounts = useCallback(async () => {
    const currentUser = userParam || localStorage.getItem("user-name") || sessionStorage.getItem("user-name");
    const currentRole = roleParam || localStorage.getItem("role") || sessionStorage.getItem("role") || "user";

    if (!currentUser) {
      setLoading(false);
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const roleLower = (currentRole || "user").toLowerCase();
      const userAccess = localStorage.getItem("user_access");

      // 1. Checklist Pending Tasks count
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      pastDate.setMonth(pastDate.getMonth() - 6);

      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);

      const pastDateStr = pastDate.toISOString().split("T")[0] + "T00:00:00";
      const futureDateStr = futureDate.toISOString().split("T")[0] + "T23:59:59";

      let checklistQuery = supabase
        .from("checklist")
        .select("department, task_description, name, planned_date, task_start_date, status")
        .is("submission_date", null)
        .gte("planned_date", pastDateStr)
        .lte("planned_date", futureDateStr)
        .order("planned_date", { ascending: true });

      if (roleLower === "user") {
        checklistQuery = checklistQuery.eq("name", currentUser);
      } else if (roleLower === "hod") {
        const { data: reports } = await supabase
          .from("users")
          .select("user_name")
          .eq("reported_by", currentUser);
        const reportingUsers = [currentUser, ...(reports?.map((r) => r.user_name) || [])];
        checklistQuery = checklistQuery.in("name", reportingUsers);
      }
      const { data: checklistTasks, error: checklistErr } = await checklistQuery;

      let pendingChecklistCount = 0;
      if (!checklistErr && checklistTasks) {
        const seen = new Set();
        const uniqueRows = checklistTasks.filter((row) => {
          const key = `${(row.department || "").trim()}::${(row.task_description || "").trim()}::${(row.name || "").trim()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        pendingChecklistCount = uniqueRows.length;
      }

      // 2. Delegation Pending count
      let delegationQuery = supabase
        .from("delegation")
        .select("planned_date, status")
        .or("submission_date.is.null,status.neq.done");

      if (roleLower === "user") {
        delegationQuery = delegationQuery.eq("name", currentUser);
      } else if (roleLower === "hod") {
        const { data: reports } = await supabase
          .from("users")
          .select("user_name")
          .eq("reported_by", currentUser);
        const reportingUsers = [currentUser, ...(reports?.map((r) => r.user_name) || [])];
        const userOrConditions = reportingUsers.map((u) => `name.eq."${u}"`).join(",");
        delegationQuery = delegationQuery.or(`${userOrConditions},given_by.eq."${currentUser}"`);
      } else if (roleLower === "admin" && userAccess && userAccess !== "all") {
        const allowedDepartments = userAccess.split(",").map((d) => d.trim()).filter((d) => d && d !== "all");
        if (allowedDepartments.length > 0) {
          const deptOrConditions = allowedDepartments.map((d) => `department.eq."${d}"`).join(",");
          delegationQuery = delegationQuery.or(`${deptOrConditions},given_by.eq."${currentUser}"`);
        }
      }
      const { data: delegationTasksForCount } = await delegationQuery;
      let delegationCount = 0;
      if (delegationTasksForCount) {
        const todayLocal = new Date();
        todayLocal.setHours(0, 0, 0, 0);
        delegationCount = delegationTasksForCount.filter((task) => {
          if (!task.planned_date) return true;
          const plannedDate = new Date(task.planned_date);
          plannedDate.setHours(0, 0, 0, 0);
          if (task.status === "extend" || task.status === "extended") {
            return true;
          }
          return plannedDate <= todayLocal;
        }).length;
      }

      // 3. Task Pending count (across Checklist, Maintenance, Repair, EA)
      let taskCount = 0;
      try {
        const { data: holidaysRes } = await supabase.from("holidays").select("holiday_date");
        const holidays = (holidaysRes || []).map((h) => h.holiday_date);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const getTimeStatusLocal = (dateString, taskStatus) => {
          if (!dateString) return "—";
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return "—";
          const taskDate = new Date(date);
          taskDate.setHours(0, 0, 0, 0);
          const isExtended = taskStatus?.toLowerCase() === "extended" || taskStatus?.toLowerCase() === "extend";
          if (isExtended) {
            if (taskDate < today) return "Overdue";
            return "Today";
          }
          if (taskDate < today) return "Overdue";
          if (taskDate.getTime() === today.getTime()) return "Today";
          return "Upcoming";
        };

        const processTaskGroup = (tasksList, nameField, isRepair = false) => {
          if (!tasksList) return 0;
          const filtered = tasksList.filter((item) => {
            if (isRepair) return true;
            const taskDate = (item.planned_date || item.task_start_date || item.created_at)?.split("T")[0];
            if (!taskDate) return true;
            return !holidays.includes(taskDate);
          });

          const seen = new Set();
          const deduplicated = filtered.filter((task) => {
            const taskDateValue = isRepair ? task.created_at : (task.planned_date || task.task_start_date || task.created_at);
            const status = taskDateValue ? getTimeStatusLocal(taskDateValue, task.status) : null;
            if (status === "Upcoming") {
              return false;
            } else {
              const taskDate = taskDateValue ? new Date(taskDateValue).toDateString() : "";
              const descKey = task.task_description || task.issue_description || "";
              const nameKey = task[nameField] || "";
              const key = `${descKey}::${nameKey}::${taskDate}`;
              if (seen.has(key)) return false;
              seen.add(key);
            }
            return true;
          });

          return deduplicated.length;
        };

        let currentChecklistTasks = checklistTasks;
        if (checklistErr || !currentChecklistTasks) {
          const { data } = await checklistQuery;
          currentChecklistTasks = data;
        }

        let maintQuery = supabase
          .from("maintenance_tasks")
          .select("*")
          .is("submission_date", null)
          .gte("planned_date", pastDateStr)
          .lte("planned_date", futureDateStr)
          .order("planned_date", { ascending: true });
        if (roleLower === "user") {
          maintQuery = maintQuery.eq("name", currentUser);
        } else if (roleLower === "hod") {
          const { data: reports } = await supabase
            .from("users")
            .select("user_name")
            .eq("reported_by", currentUser);
          const reportingUsers = [currentUser, ...(reports?.map((r) => r.user_name) || [])];
          maintQuery = maintQuery.in("name", reportingUsers);
        }
        const { data: maintTasks } = await maintQuery;

        let repairQuery = supabase
          .from("repair_tasks")
          .select("*")
          .is("submission_date", null)
          .order("created_at", { ascending: false });
        if (roleLower === "user") {
          repairQuery = repairQuery.eq("assigned_person", currentUser);
        } else if (roleLower === "hod") {
          const { data: reports } = await supabase
            .from("users")
            .select("user_name")
            .eq("reported_by", currentUser);
          const reportingUsers = [currentUser, ...(reports?.map((r) => r.user_name) || [])];
          repairQuery = repairQuery.in("assigned_person", reportingUsers);
        }
        const { data: repairTasks } = await repairQuery;

        let eaQuery = supabase
          .from("ea_tasks")
          .select("*")
          .in("status", ["pending", "extend", "extended"])
          .order("task_start_date", { ascending: true });
        if (roleLower === "user") {
          eaQuery = eaQuery.eq("doer_name", currentUser);
        } else if (roleLower === "hod") {
          const { data: reports } = await supabase
            .from("users")
            .select("user_name")
            .eq("reported_by", currentUser);
          const reportingUsers = [currentUser, ...(reports?.map((r) => r.user_name) || [])];
          eaQuery = eaQuery.in("doer_name", reportingUsers);
        }
        const { data: eaTasks } = await eaQuery;

        const checklistCount = processTaskGroup(currentChecklistTasks, "name", false);
        const maintCount = processTaskGroup(maintTasks, "name", false);
        const repairCount = processTaskGroup(repairTasks, "assigned_person", true);
        const eaCount = processTaskGroup(eaTasks, "doer_name", false);

        taskCount = checklistCount + maintCount + repairCount + eaCount;
      } catch (err) {
        console.error("Error calculating total task count:", err);
      }

      // 4. Admin Approval count
      let approvalCount = 0;
      if (roleLower === "admin" || roleLower === "hod") {
        const usernameLower = currentUser.toLowerCase();
        const isSystemAdmin = roleLower === "admin" || usernameLower === "admin";

        let reportingUsers = [];
        if (!isSystemAdmin && roleLower === "hod") {
          const { data: reports } = await supabase
            .from("users")
            .select("user_name")
            .eq("reported_by", currentUser);
          if (reports) {
            reportingUsers = reports.map((r) => (r.user_name || "").toLowerCase());
          }
        }

        const filterApprovals = (items, idKey) => {
          if (!items) return [];
          const seenIds = new Set();
          const unique = items.filter((task) => {
            const baseId = task[idKey] || task.task_id || task.original_task_id || task.id;
            if (!baseId || seenIds.has(baseId)) return false;
            seenIds.add(baseId);
            return true;
          });

          if (isSystemAdmin) return unique;

          return unique.filter((task) => {
            const doerName = (task.doer_name || task.name || task.filled_by || "").toLowerCase();
            return doerName !== usernameLower && reportingUsers.includes(doerName);
          });
        };

        const { data: checklistApp } = await supabase
          .from("checklist")
          .select("*")
          .not("submission_date", "is", null)
          .or("admin_done.is.null,admin_done.eq.false");
        const checklistFiltered = filterApprovals(checklistApp, "task_id");

        const { data: delegationApp } = await supabase
          .from("delegation_done")
          .select("*")
          .eq("status", "pending");
        const delegationFiltered = filterApprovals(delegationApp, "id");

        const { data: maintApp } = await supabase
          .from("maintenance_tasks")
          .select("*")
          .not("submission_date", "is", null)
          .or("admin_done.is.null,admin_done.eq.false");
        const maintFiltered = filterApprovals(maintApp, "id");

        const { data: repairApp } = await supabase
          .from("repair_tasks")
          .select("*")
          .eq("status", "Pending Approval");
        const repairFiltered = filterApprovals(repairApp, "id");

        const { data: eaApp } = await supabase
          .from("ea_tasks_done")
          .select("*")
          .eq("status", "pending");
        const eaFiltered = filterApprovals(eaApp, "id");

        approvalCount =
          checklistFiltered.length +
          delegationFiltered.length +
          maintFiltered.length +
          repairFiltered.length +
          eaFiltered.length;
      }

      // 5. Sample Management pending count (dispatch_sent_date IS NULL)
      let sampleManagementCount = 0;
      try {
        const { count: sampleCount, error: sampleErr } = await supabase
          .from("sample_system_sample_management")
          .select("*", { count: "exact", head: true })
          .is("dispatch_sent_date", null);
        if (!sampleErr) {
          sampleManagementCount = sampleCount ?? 0;
        }
      } catch (err) {
        console.error("Error fetching sample management count:", err);
      }

      // 6. Production Planning, Approval, and Monitoring pending counts
      let productionPlanningCount = 0;
      let productionApprovalCount = 0;
      let productionMonitoringCount = 0;
      try {
        const { data: ppData, error: ppErr } = await supabase
          .from("sample_system_product_planning")
          .select("id, approval_status, is_history")
          .eq("is_history", false);
        if (!ppErr && ppData) {
          productionPlanningCount = ppData.filter(p => !p.approval_status || p.approval_status === "draft" || p.approval_status === "rejected").length;
          productionApprovalCount = ppData.filter(p => p.approval_status === "pending_approval").length;
          productionMonitoringCount = ppData.filter(p => p.approval_status === "approved").length;
        }
      } catch (err) {
        console.error("Error fetching production planning count:", err);
      }

      // 7. Procurement System pending counts (actual_receipt_date IS NULL)
      let procurementNewLeatherCount = 0;
      let procurementDailyLeatherCount = 0;
      let procurementMaterialCount = 0;
      try {
        const [nlCountRes, dlCountRes, matCountRes, pkgCountRes] = await Promise.all([
          supabase
            .from("procurement_new_leather")
            .select("*", { count: "exact", head: true })
            .is("actual_receipt_date", null),
          supabase
            .from("procurement_daily_leather")
            .select("*", { count: "exact", head: true })
            .is("actual_receipt_date", null),
          supabase
            .from("procurement_material")
            .select("*", { count: "exact", head: true })
            .is("actual_receipt_date", null),
          supabase
            .from("procurement_packaging")
            .select("*", { count: "exact", head: true })
            .is("actual_receipt_date", null),
        ]);

        if (!nlCountRes.error) {
          procurementNewLeatherCount = nlCountRes.count ?? 0;
        } else {
          try {
            const cached = JSON.parse(localStorage.getItem("erp_new_leather") || "[]");
            procurementNewLeatherCount = cached.filter((i) => !i.actualReceiptDate).length;
          } catch {}
        }

        if (!dlCountRes.error) {
          procurementDailyLeatherCount = dlCountRes.count ?? 0;
        } else {
          try {
            const cached = JSON.parse(localStorage.getItem("erp_daily_leather") || "[]");
            procurementDailyLeatherCount = cached.filter((i) => !i.actualReceiptDate).length;
          } catch {}
        }

        let matCount = 0;
        if (!matCountRes.error) {
          matCount = matCountRes.count ?? 0;
        } else {
          try {
            const cached = JSON.parse(localStorage.getItem("erp_materials") || "[]");
            matCount = cached.filter((i) => !i.actualReceiptDate).length;
          } catch {}
        }

        let pkgCount = 0;
        if (!pkgCountRes.error) {
          pkgCount = pkgCountRes.count ?? 0;
        } else {
          try {
            const cached = JSON.parse(localStorage.getItem("erp_packaging") || "[]");
            pkgCount = cached.filter((i) => !i.actualReceiptDate).length;
          } catch {}
        }

        procurementMaterialCount = matCount + pkgCount;
      } catch (err) {
        console.error("Error fetching procurement counts:", err);
      }

      const newCounts = {
        quickTask: pendingChecklistCount,
        delegation: delegationCount || 0,
        task: taskCount,
        adminApproval: approvalCount,
        sampleManagement: sampleManagementCount || 0,
        productionPlanning: productionPlanningCount || 0,
        productionApproval: productionApprovalCount || 0,
        productionMonitoring: productionMonitoringCount || 0,
        procurementNewLeather: procurementNewLeatherCount || 0,
        procurementDailyLeather: procurementDailyLeatherCount || 0,
        procurementMaterial: procurementMaterialCount || 0,
      };

      cachedCounts = newCounts;
      lastFetchTime = Date.now();
      setMenuCounts(newCounts);
    } catch (err) {
      console.error("Error in useUnifiedCounts:", err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [userParam, roleParam]);

  useEffect(() => {
    const isCacheValid = cachedCounts && Date.now() - lastFetchTime < CACHE_TTL;
    if (!isCacheValid) {
      fetchCounts();
    } else {
      setLoading(false);
    }

    const handleProcurementUpdate = () => fetchCounts();
    const handleProductionUpdate = () => fetchCounts();
    const handleFocus = () => fetchCounts();

    window.addEventListener("procurement-updated", handleProcurementUpdate);
    window.addEventListener("production-updated", handleProductionUpdate);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("procurement-updated", handleProcurementUpdate);
      window.removeEventListener("production-updated", handleProductionUpdate);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchCounts]);

  const checklistTotal = (menuCounts.delegation || 0) + (menuCounts.task || 0) + (menuCounts.adminApproval || 0);
  const sampleTotal = menuCounts.sampleManagement || 0;
  const productionTotal = (menuCounts.productionPlanning || 0) + (menuCounts.productionApproval || 0) + (menuCounts.productionMonitoring || 0);
  const procurementTotal =
    (menuCounts.procurementNewLeather || 0) +
    (menuCounts.procurementDailyLeather || 0) +
    (menuCounts.procurementMaterial || 0);

  const totalPendingAllSystems = checklistTotal + sampleTotal + productionTotal + procurementTotal;

  return {
    menuCounts,
    systemTotals: {
      checklist: checklistTotal,
      sample: sampleTotal,
      production: productionTotal,
      procurement: procurementTotal,
      total: totalPendingAllSystems,
    },
    loading,
    refreshCounts: fetchCounts,
  };
}

export default useUnifiedCounts;
