"use client";
import aceLogo from "../../assets/sapidLogo.png";

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications } from "../../redux/slice/notificationSlice";
import supabase from "../../SupabaseClient";
import {
  CheckSquare,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Database,
  ChevronDown,
  ChevronRight,
  Zap,
  Settings,
  CirclePlus,
  UserRound,
  CalendarCheck,
  Calendar as CalendarIcon,
  BookmarkCheck,
  CrossIcon,
  X,
  Bell,
  Video,
  TrendingUp,
  LayoutGrid,
  BarChart3,
} from "lucide-react";
import MobileSystemLauncher from "./MobileSystemLauncher";
import MobileBottomNav from "./MobileBottomNav";
import useUnifiedCounts from "../../hooks/useUnifiedCounts";

const isChecklistPath = (path) => {
  const checklistPaths = [
    "/dashboard/admin",
    "/dashboard/notifications",
    "/dashboard/quick-task",
    "/dashboard/checklist",
    "/dashboard/maintenance",
    "/dashboard/repair",
    "/dashboard/ea-task",
    "/dashboard/assign-task",
    "/dashboard/delegation",
    "/dashboard/delegation-data",
    "/dashboard/task",
    "/dashboard/calendar",
    "/dashboard/holiday-list",
    "/dashboard/working-day-calendar",
    "/dashboard/admin-approval",
    "/dashboard/training-video",
    "/dashboard/data",
    "/dashboard/admin-data",
    "/dashboard/mis-report",
    "/dashboard/demo"
  ];
  return checklistPaths.some(p => path === p || path.startsWith(p + "/"));
};

const isSamplePath = (path) => {
  const samplePaths = [
    "/dashboard/sample-dashboard",
    "/dashboard/sample-management"
  ];
  return samplePaths.some(p => path === p || path.startsWith(p + "/"));
};

const isBulkPath = (path) => {
  const bulkPaths = [
    "/dashboard/bulk-dashboard",
    "/dashboard/bulk-order"
  ];
  return bulkPaths.some(p => path === p || path.startsWith(p + "/"));
};

const isProcurementPath = (path) => {
  return path.startsWith("/dashboard/procurement");
};

export default function AdminLayout({ children, darkMode = false, toggleDarkMode = undefined, showLayout = true }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list: notifications } = useSelector((state) => state.notifications);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChecklistSubmenuOpen, setIsChecklistSubmenuOpen] = useState(() => isChecklistPath(location.pathname));
  const [isSampleSubmenuOpen, setIsSampleSubmenuOpen] = useState(() => isSamplePath(location.pathname));
  const [isBulkSubmenuOpen, setIsBulkSubmenuOpen] = useState(() => isBulkPath(location.pathname));
  const [isProcurementSubmenuOpen, setIsProcurementSubmenuOpen] = useState(() => isProcurementPath(location.pathname));
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const [pageAccess, setPageAccess] = useState({});

  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);
  const [menuCounts, setMenuCounts] = useState({
    quickTask: null,
    delegation: null,
    task: null,
    adminApproval: null,
    sampleManagement: null,
    productionPlanning: null,
    procurementNewLeather: null,
    procurementDailyLeather: null,
    procurementMaterial: null
  });

  const { menuCounts: unifiedCounts } = useUnifiedCounts(username, userRole);

  useEffect(() => {
    if (unifiedCounts) {
      setMenuCounts(unifiedCounts);
    }
  }, [unifiedCounts]);

  const handleToggleSubmenu = (clickedRoute) => {
    const nextState = !clickedRoute.isOpen;

    if (nextState) {
      // Accordion behavior: opening a submenu closes all other submenus
      setIsChecklistSubmenuOpen(clickedRoute.label === "Checklist");
      setIsSampleSubmenuOpen(clickedRoute.label === "Sample System");
      setIsBulkSubmenuOpen(clickedRoute.label === "Production Planning" || clickedRoute.label === "Production Planning and Monitoring");
      setIsProcurementSubmenuOpen(clickedRoute.label === "Procurement System");
    } else {
      // Closing this specific submenu
      clickedRoute.setIsOpen(false);
    }
  };


  // Check authentication on component mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("user-name") || sessionStorage.getItem("user-name");
    const storedRole = localStorage.getItem("role") || sessionStorage.getItem("role");
    const storedEmail = localStorage.getItem("email_id") || sessionStorage.getItem("email_id");

    if (!storedUsername) {
      const retryUser = localStorage.getItem("user-name") || sessionStorage.getItem("user-name");
      if (!retryUser) {
        navigate("/login");
        return;
      }
    }

    setUsername(storedUsername);
    setUserRole(storedRole || "user");
    setUserEmail(storedEmail);
    setIsSuperAdmin(storedUsername.toLowerCase() === "admin");

    const cachedPageAccess = JSON.parse(localStorage.getItem("page_access") || "{}");
    setPageAccess(cachedPageAccess);

    // Sync user permissions in the background
    const syncUserPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("page_access, role")
          .eq("user_name", storedUsername)
          .maybeSingle();

        if (data) {
          const freshAccess = typeof data.page_access === 'object' ? data.page_access : JSON.parse(data.page_access || "{}");
          const freshAccessStr = typeof data.page_access === 'object' ? JSON.stringify(data.page_access) : (data.page_access || "{}");
          localStorage.setItem("page_access", freshAccessStr);
          localStorage.setItem("role", data.role || "");
          setPageAccess(freshAccess);
          setUserRole(data.role || "user");
        }
      } catch (err) {
        console.error("Error syncing permissions:", err);
      }
    };
    syncUserPermissions();

    // Centralized Security Guard using page_access permissions
    const path = location.pathname;
    const storedRoleLower = (storedRole || "user").toLowerCase();

    if (storedRoleLower !== "admin") {
      if (path === "/dashboard" || path.match(/^\/dashboard\/(procurement|production|sample|checklist)\/[^/]+$/)) {
        return;
      }
      const activeAccess = JSON.parse(localStorage.getItem("page_access") || "{}");

      const exceptionPaths = [
        "/dashboard/admin",
        "/dashboard/notifications",
        "/dashboard/training-video"
      ];

      const isException = exceptionPaths.some(p => path === p || path.startsWith(p + "/"));

      if (isProcurementPath(path)) {
        const currentPermission = activeAccess[path];
        if (currentPermission === "none") {
          navigate("/dashboard/admin");
          return;
        }
      } else if (!isException) {
        // Also check if any parent route path exists in pageAccess as a fallback
        const currentPermission = activeAccess[path];
        if (!currentPermission || currentPermission === "none") {
          navigate("/dashboard/admin");
          return;
        }
      }
    }

    // Initial load from localStorage
    const cachedImage = localStorage.getItem("profile_image");
    setProfileImage(cachedImage || "");

    // Fetch reporting users for HOD role check
    let reportingUsers = [storedUsername?.toLowerCase()];
    const currentUserRole = (localStorage.getItem("role") || "").toLowerCase();
    if (currentUserRole === "hod") {
      const fetchReportingUsers = async () => {
        const { data: reports } = await supabase
          .from("users")
          .select("user_name")
          .eq("reported_by", storedUsername);
        if (reports) {
          reportingUsers = [storedUsername.toLowerCase(), ...reports.map(r => (r.user_name || "").toLowerCase())];
        }
      };
      fetchReportingUsers();
    }

    // Sync with database to get the latest image
    const syncProfileImage = async () => {
      try {
        const { data } = await supabase
          .from("users")
          .select("profile_image")
          .eq("user_name", storedUsername)
          .single();

        if (data && data.profile_image) {
          setProfileImage(data.profile_image);
          localStorage.setItem("profile_image", data.profile_image);
          console.log("✅ Profile image synced from DB:", data.profile_image);
        }
      } catch (err) {
        console.error("❌ Error syncing profile image:", err);
      }
    };

    if (storedUsername) {
      syncProfileImage();
    }

    console.log("AdminLayout - Profile Image URL (Cached):", cachedImage);

    // Check if this is the super admin (username = 'admin')
    const normalizedUsername = (storedUsername || "").toLowerCase();
    setIsSuperAdmin(normalizedUsername === "admin");
  }, [navigate, location.pathname]);

  const fetchSidebarCounts = async (currentUser, currentRole) => {
    if (!currentUser) return;
    try {
      const roleLower = (currentRole || "user").toLowerCase();
      const userAccess = localStorage.getItem("user_access");

      // 1. Checklist Pending Tasks count (Deduplicated like Quick Task page checklist tab)
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      pastDate.setMonth(pastDate.getMonth() - 6);

      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);

      const pastDateStr = pastDate.toISOString().split('T')[0] + 'T00:00:00';
      const futureDateStr = futureDate.toISOString().split('T')[0] + 'T23:59:59';

      let checklistQuery = supabase
        .from('checklist')
        .select('department, task_description, name, planned_date, task_start_date, status')
        .is('submission_date', null)
        .gte('planned_date', pastDateStr)
        .lte('planned_date', futureDateStr)
        .order('planned_date', { ascending: true });

      if (roleLower === 'user') {
        checklistQuery = checklistQuery.eq('name', currentUser);
      } else if (roleLower === 'hod') {
        const { data: reports } = await supabase
          .from("users")
          .select("user_name")
          .eq("reported_by", currentUser);
        const reportingUsers = [currentUser, ...(reports?.map(r => r.user_name) || [])];
        checklistQuery = checklistQuery.in('name', reportingUsers);
      }
      const { data: checklistTasks, error: checklistErr } = await checklistQuery;

      let pendingChecklistCount = 0;
      if (!checklistErr && checklistTasks) {
        const seen = new Set();
        const uniqueRows = checklistTasks.filter(row => {
          const key = `${(row.department || '').trim()}::${(row.task_description || '').trim()}::${(row.name || '').trim()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        pendingChecklistCount = uniqueRows.length;
      }

      // 2. Delegation Pending count (matching Delegation page fetchDelegationDataSortByDate)
      let delegationQuery = supabase
        .from('delegation')
        .select('planned_date, status')
        .or('submission_date.is.null,status.neq.done');

      if (roleLower === 'user') {
        delegationQuery = delegationQuery.eq('name', currentUser);
      } else if (roleLower === 'hod') {
        const { data: reports } = await supabase
          .from("users")
          .select("user_name")
          .eq("reported_by", currentUser);
        const reportingUsers = [currentUser, ...(reports?.map(r => r.user_name) || [])];
        const userOrConditions = reportingUsers.map(u => `name.eq."${u}"`).join(',');
        delegationQuery = delegationQuery.or(`${userOrConditions},given_by.eq."${currentUser}"`);
      } else if (roleLower === 'admin' && userAccess && userAccess !== 'all') {
        const allowedDepartments = userAccess.split(',').map(dept => dept.trim()).filter(d => d && d !== 'all');
        if (allowedDepartments.length > 0) {
          const deptOrConditions = allowedDepartments.map(d => `department.eq."${d}"`).join(',');
          delegationQuery = delegationQuery.or(`${deptOrConditions},given_by.eq."${currentUser}"`);
        }
      }
      const { data: delegationTasksForCount } = await delegationQuery;
      let delegationCount = 0;
      if (delegationTasksForCount) {
        const todayLocal = new Date();
        todayLocal.setHours(0, 0, 0, 0);
        delegationCount = delegationTasksForCount.filter(task => {
          if (!task.planned_date) return true;
          const plannedDate = new Date(task.planned_date);
          plannedDate.setHours(0, 0, 0, 0);
          if (task.status === "extend" || task.status === "extended") {
            return true;
          }
          return plannedDate <= todayLocal;
        }).length;
      }

      // 3. Task Pending count (sum of all pending & overdue tasks across Checklist, Maintenance, Repair, and EA)
      let taskCount = 0;
      try {
        const { data: holidaysRes } = await supabase.from('holidays').select('holiday_date');
        const holidays = (holidaysRes || []).map(h => h.holiday_date);

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

          const filtered = tasksList.filter(item => {
            if (isRepair) return true;
            const taskDate = (item.planned_date || item.task_start_date || item.created_at)?.split('T')[0];
            if (!taskDate) return true;
            return !holidays.includes(taskDate);
          });

          const seen = new Set();
          const deduplicated = filtered.filter(task => {
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

        // Fetch Maintenance tasks
        let maintQuery = supabase
          .from('maintenance_tasks')
          .select('*')
          .is('submission_date', null)
          .gte('planned_date', pastDateStr)
          .lte('planned_date', futureDateStr)
          .order('planned_date', { ascending: true });
        if (roleLower === 'user') {
          maintQuery = maintQuery.eq('name', currentUser);
        } else if (roleLower === 'hod') {
          const { data: reports } = await supabase
            .from("users")
            .select("user_name")
            .eq("reported_by", currentUser);
          const reportingUsers = [currentUser, ...(reports?.map(r => r.user_name) || [])];
          maintQuery = maintQuery.in('name', reportingUsers);
        }
        const { data: maintTasks } = await maintQuery;

        // Fetch Repair tasks
        let repairQuery = supabase
          .from('repair_tasks')
          .select('*')
          .is('submission_date', null)
          .order('created_at', { ascending: false });
        if (roleLower === 'user') {
          repairQuery = repairQuery.eq('assigned_person', currentUser);
        } else if (roleLower === 'hod') {
          const { data: reports } = await supabase
            .from("users")
            .select("user_name")
            .eq("reported_by", currentUser);
          const reportingUsers = [currentUser, ...(reports?.map(r => r.user_name) || [])];
          repairQuery = repairQuery.in('assigned_person', reportingUsers);
        }
        const { data: repairTasks } = await repairQuery;

        // Fetch EA tasks
        let eaQuery = supabase
          .from('ea_tasks')
          .select('*')
          .in('status', ['pending', 'extend', 'extended'])
          .order('task_start_date', { ascending: true });
        if (roleLower === 'user') {
          eaQuery = eaQuery.eq('doer_name', currentUser);
        } else if (roleLower === 'hod') {
          const { data: reports } = await supabase
            .from("users")
            .select("user_name")
            .eq("reported_by", currentUser);
          const reportingUsers = [currentUser, ...(reports?.map(r => r.user_name) || [])];
          eaQuery = eaQuery.in('doer_name', reportingUsers);
        }
        const { data: eaTasks } = await eaQuery;

        const checklistCount = processTaskGroup(currentChecklistTasks, 'name', false);
        const maintCount = processTaskGroup(maintTasks, 'name', false);
        const repairCount = processTaskGroup(repairTasks, 'assigned_person', true);
        const eaCount = processTaskGroup(eaTasks, 'doer_name', false);

        taskCount = checklistCount + maintCount + repairCount + eaCount;
      } catch (err) {
        console.error("Error calculating total task count:", err);
      }

      // 4. Admin Approval count
      let approvalCount = 0;
      if (roleLower === 'admin' || roleLower === 'hod') {
        const usernameLower = currentUser.toLowerCase();
        const isSystemAdmin = roleLower === 'admin' || usernameLower === 'admin';

        let reportingUsers = [];
        if (!isSystemAdmin && roleLower === 'hod') {
          const { data: reports } = await supabase
            .from("users")
            .select("user_name")
            .eq("reported_by", currentUser);
          if (reports) {
            reportingUsers = reports.map(r => (r.user_name || "").toLowerCase());
          }
        }

        const filterApprovals = (items, idKey) => {
          if (!items) return [];
          const seenIds = new Set();
          const unique = items.filter(task => {
            const baseId = task[idKey] || task.task_id || task.original_task_id || task.id;
            if (!baseId || seenIds.has(baseId)) return false;
            seenIds.add(baseId);
            return true;
          });

          if (isSystemAdmin) {
            return unique;
          }

          return unique.filter(task => {
            const doerName = (task.doer_name || task.name || task.filled_by || "").toLowerCase();
            return doerName !== usernameLower && reportingUsers.includes(doerName);
          });
        };

        const { data: checklistApp } = await supabase
          .from('checklist')
          .select('*')
          .not('submission_date', 'is', null)
          .or('admin_done.is.null,admin_done.eq.false');
        const checklistFiltered = filterApprovals(checklistApp, 'task_id');

        const { data: delegationApp } = await supabase
          .from('delegation_done')
          .select('*')
          .eq('status', 'pending');
        const delegationFiltered = filterApprovals(delegationApp, 'id');

        const { data: maintApp } = await supabase
          .from('maintenance_tasks')
          .select('*')
          .not('submission_date', 'is', null)
          .or('admin_done.is.null,admin_done.eq.false');
        const maintFiltered = filterApprovals(maintApp, 'id');

        const { data: repairApp } = await supabase
          .from('repair_tasks')
          .select('*')
          .eq('status', 'Pending Approval');
        const repairFiltered = filterApprovals(repairApp, 'id');

        const { data: eaApp } = await supabase
          .from('ea_tasks_done')
          .select('*')
          .eq('status', 'pending');
        const eaFiltered = filterApprovals(eaApp, 'id');

        approvalCount = checklistFiltered.length + delegationFiltered.length + maintFiltered.length + repairFiltered.length + eaFiltered.length;
      }

      // 5. Sample Management pending count (dispatch_sent_date IS NULL)
      let sampleManagementCount = 0;
      try {
        const { count: sampleCount, error: sampleErr } = await supabase
          .from('sample_system_sample_management')
          .select('*', { count: 'exact', head: true })
          .is('dispatch_sent_date', null);
        if (!sampleErr) {
          sampleManagementCount = sampleCount ?? 0;
        }
      } catch (err) {
        console.error('Error fetching sample management count:', err);
      }

      // 6. Production Planning pending count (is_history = false)
      let productionPlanningCount = 0;
      try {
        const { count: ppCount, error: ppErr } = await supabase
          .from('sample_system_product_planning')
          .select('*', { count: 'exact', head: true })
          .eq('is_history', false);
        if (!ppErr) {
          productionPlanningCount = ppCount ?? 0;
        }
      } catch (err) {
        console.error('Error fetching production planning count:', err);
      }

      // 7. Procurement System pending counts (actual_receipt_date IS NULL)
      let procurementNewLeatherCount = 0;
      let procurementDailyLeatherCount = 0;
      let procurementMaterialCount = 0;
      try {
        const [nlCountRes, dlCountRes, matCountRes, pkgCountRes] = await Promise.all([
          supabase
            .from('procurement_new_leather')
            .select('*', { count: 'exact', head: true })
            .is('actual_receipt_date', null),
          supabase
            .from('procurement_daily_leather')
            .select('*', { count: 'exact', head: true })
            .is('actual_receipt_date', null),
          supabase
            .from('procurement_material')
            .select('*', { count: 'exact', head: true })
            .is('actual_receipt_date', null),
          supabase
            .from('procurement_packaging')
            .select('*', { count: 'exact', head: true })
            .is('actual_receipt_date', null),
        ]);

        if (!nlCountRes.error) {
          procurementNewLeatherCount = nlCountRes.count ?? 0;
        } else {
          try {
            const cached = JSON.parse(localStorage.getItem('erp_new_leather') || '[]');
            procurementNewLeatherCount = cached.filter((i) => !i.actualReceiptDate).length;
          } catch {}
        }

        if (!dlCountRes.error) {
          procurementDailyLeatherCount = dlCountRes.count ?? 0;
        } else {
          try {
            const cached = JSON.parse(localStorage.getItem('erp_daily_leather') || '[]');
            procurementDailyLeatherCount = cached.filter((i) => !i.actualReceiptDate).length;
          } catch {}
        }

        let matCount = 0;
        if (!matCountRes.error) {
          matCount = matCountRes.count ?? 0;
        } else {
          try {
            const cached = JSON.parse(localStorage.getItem('erp_materials') || '[]');
            matCount = cached.filter((i) => !i.actualReceiptDate).length;
          } catch {}
        }

        let pkgCount = 0;
        if (!pkgCountRes.error) {
          pkgCount = pkgCountRes.count ?? 0;
        } else {
          try {
            const cached = JSON.parse(localStorage.getItem('erp_packaging') || '[]');
            pkgCount = cached.filter((i) => !i.actualReceiptDate).length;
          } catch {}
        }

        procurementMaterialCount = matCount + pkgCount;
      } catch (err) {
        console.error('Error fetching procurement counts:', err);
      }

      setMenuCounts({
        quickTask: pendingChecklistCount,
        delegation: delegationCount || 0,
        task: taskCount,
        adminApproval: approvalCount,
        sampleManagement: sampleManagementCount || 0,
        productionPlanning: productionPlanningCount || 0,
        procurementNewLeather: procurementNewLeatherCount || 0,
        procurementDailyLeather: procurementDailyLeatherCount || 0,
        procurementMaterial: procurementMaterialCount || 0
      });
    } catch (err) {
      console.error("Error fetching sidebar counts:", err);
    }
  };

  useEffect(() => {
    if (username) {
      fetchSidebarCounts(username, userRole);
    }
  }, [username, userRole, location.pathname]);

  // Realtime / reactive listener for procurement updates
  useEffect(() => {
    const handleProcurementUpdate = () => {
      if (username) {
        fetchSidebarCounts(username, userRole);
      }
    };
    window.addEventListener('procurement-updated', handleProcurementUpdate);
    return () => {
      window.removeEventListener('procurement-updated', handleProcurementUpdate);
    };
  }, [username, userRole]);

  // Fetch notifications globally for badge count + Realtime sync
  useEffect(() => {
    const refreshNotifications = () => {
      const role = localStorage.getItem("role");
      const userId = localStorage.getItem("user-id");
      if (role) {
        dispatch(fetchNotifications({ role: role.toLowerCase(), userId }));
      }
    };

    refreshNotifications();

    const handleCustomEvent = () => refreshNotifications();
    window.addEventListener("notification-sent", handleCustomEvent);

    const notifChannel = supabase
      .channel("global_notifications_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          refreshNotifications();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener("notification-sent", handleCustomEvent);
      supabase.removeChannel(notifChannel);
    };
  }, [dispatch, location.pathname]);

  // Sync submenu open states based on current location
  useEffect(() => {
    const path = location.pathname;
    setIsChecklistSubmenuOpen(isChecklistPath(path));
    setIsSampleSubmenuOpen(isSamplePath(path));
    setIsBulkSubmenuOpen(isBulkPath(path));
    setIsProcurementSubmenuOpen(isProcurementPath(path));
  }, [location.pathname]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user-name");
    localStorage.removeItem("role");
    localStorage.removeItem("email_id");
    localStorage.removeItem("token");
    localStorage.removeItem("profile_image");
    window.location.href = "/login";
  };

  // No data categories needed as Task is now a main route

  // Update the routes array based on user role and super admin status
  const routes = [
    {
      href: "/dashboard",
      label: "Reports",
      icon: BarChart3,
      showFor: ["admin", "user", "HOD"],
      active: location.pathname === "/dashboard",
    },
    {
      label: "Checklist",
      icon: ClipboardList,
      showFor: ["admin", "user", "HOD"],
      isSubmenu: true,
      isOpen: isChecklistSubmenuOpen,
      setIsOpen: setIsChecklistSubmenuOpen,
      badge: ((menuCounts.delegation || 0) + (menuCounts.task || 0) + (menuCounts.adminApproval || 0)) || null,
      active: isChecklistPath(location.pathname),
      subItems: [
        {
          href: "/dashboard/admin",
          label: "Dashboard",
          active: location.pathname === "/dashboard/admin",
          showFor: ["admin", "user", "HOD"],
        },
        {
          href: "/dashboard/notifications",
          label: "Notifications",
          active: location.pathname === "/dashboard/notifications",
          showFor: ["admin", "user", "hod"],
          badge: notifications.filter(n => !n.isRead).length || null,
        },
        {
          href: "/dashboard/quick-task",
          label: "Quick Task",
          active: location.pathname === "/dashboard/quick-task",
          showFor: (isSuperAdmin || userRole.toLowerCase() === "admin") ? ["admin"] : [],
          badge: null,
        },
        {
          href: "/dashboard/assign-task",
          label: "Assign Task",
          active: location.pathname === "/dashboard/assign-task",
          showFor: ["admin", "HOD"],
        },
        {
          href: "/dashboard/delegation",
          label: "Delegation",
          active: location.pathname === "/dashboard/delegation",
          showFor: ["admin", "user", "HOD"],
          badge: menuCounts.delegation || null,
        },
        {
          href: "/dashboard/task",
          label: "Task",
          active: location.pathname === "/dashboard/task",
          showFor: ["admin", "HOD", "user"],
          badge: menuCounts.task || null,
        },
        {
          href: "/dashboard/calendar",
          label: "Calendar",
          active: location.pathname === "/dashboard/calendar",
          showFor: ["admin", "user", "HOD"],
        },
        {
          href: "/dashboard/holiday-list",
          label: "Holiday List",
          active: location.pathname === "/dashboard/holiday-list",
          showFor: ["admin"],
        },
        {
          href: "/dashboard/working-day-calendar",
          label: "Working Day Calendar",
          active: location.pathname === "/dashboard/working-day-calendar",
          showFor: ["admin"],
        },
        {
          href: "/dashboard/admin-approval",
          label: "Admin Approval",
          active: location.pathname === "/dashboard/admin-approval",
          showFor: ["admin", "HOD"],
          badge: menuCounts.adminApproval || null,
        },
        {
          href: "/dashboard/training-video",
          label: "Training Video",
          active: location.pathname === "/dashboard/training-video",
          showFor: ["admin", "user", "HOD"],
        }
      ]
    },
    {
      label: "Sample System",
      icon: Database,
      showFor: ["admin", "user", "HOD"],
      isSubmenu: true,
      isOpen: isSampleSubmenuOpen,
      setIsOpen: setIsSampleSubmenuOpen,
      badge: menuCounts.sampleManagement || null,
      active: isSamplePath(location.pathname),
      subItems: [
        {
          href: "/dashboard/sample-dashboard",
          label: "Dashboard",
          active: location.pathname === "/dashboard/sample-dashboard",
          showFor: ["admin", "user", "HOD"],
        },
        {
          href: "/dashboard/sample-management",
          label: "Sample Management",
          active: location.pathname === "/dashboard/sample-management",
          showFor: ["admin", "user", "HOD"],
          badge: menuCounts.sampleManagement || null,
        }
      ]
    },
    {
      label: "Production Planning",
      icon: TrendingUp,
      showFor: ["admin", "user", "HOD"],
      isSubmenu: true,
      isOpen: isBulkSubmenuOpen,
      setIsOpen: setIsBulkSubmenuOpen,
      badge: menuCounts.productionPlanning || null,
      active: isBulkPath(location.pathname),
      subItems: [
        {
          href: "/dashboard/bulk-dashboard",
          label: "Dashboard",
          active: location.pathname === "/dashboard/bulk-dashboard",
          showFor: ["admin", "user", "HOD"],
        },
        {
          href: "/dashboard/bulk-order",
          label: "Production Planning and Monitoring",
          active: location.pathname === "/dashboard/bulk-order",
          showFor: ["admin", "user", "HOD"],
          badge: menuCounts.productionPlanning || null,
        }
      ]
    },
    {
      label: "Procurement System",
      icon: Zap,
      showFor: ["admin", "user", "HOD"],
      isSubmenu: true,
      isOpen: isProcurementSubmenuOpen,
      setIsOpen: setIsProcurementSubmenuOpen,
      badge: ((menuCounts.procurementNewLeather || 0) + (menuCounts.procurementDailyLeather || 0) + (menuCounts.procurementMaterial || 0)) || null,
      active: isProcurementPath(location.pathname),
      subItems: [
        {
          href: "/dashboard/procurement",
          label: "Dashboard",
          active: location.pathname === "/dashboard/procurement",
          showFor: ["admin", "user", "HOD"],
        },
        {
          href: "/dashboard/procurement/new-leather",
          label: "New Leather Dev",
          active: location.pathname === "/dashboard/procurement/new-leather",
          showFor: ["admin", "user", "HOD"],
          badge: menuCounts.procurementNewLeather || null,
        },
        {
          href: "/dashboard/procurement/daily-leather",
          label: "Daily Leather Proc",
          active: location.pathname === "/dashboard/procurement/daily-leather",
          showFor: ["admin", "user", "HOD"],
          badge: menuCounts.procurementDailyLeather || null,
        },
        {
          href: "/dashboard/procurement/material",
          label: "Daily Material Proc",
          active: location.pathname === "/dashboard/procurement/material",
          showFor: ["admin", "user", "HOD"],
          badge: menuCounts.procurementMaterial || null,
        }
      ]
    },
    {
      href: "/dashboard/setting",
      label: "Settings",
      icon: Settings,
      active: location.pathname === "/dashboard/setting",
      showFor: ["admin"],
    }
  ];

  const getAccessibleDepartments = () => {
    return [];
  };

  // Filter routes based on page_access permissions state
  const getAccessibleRoutes = () => {
    const userRole = (localStorage.getItem("role") || "user").toLowerCase();

    // Admins bypass all restrictions
    if (userRole === "admin") {
      return routes;
    }

    // Standard exceptions that are visible to any authenticated user
    const exceptionPaths = [
      "/dashboard/admin",
      "/dashboard/notifications",
      "/dashboard/training-video"
    ];

    const hasAccess = (href) => {
      if (href === "/dashboard" || href.startsWith("/dashboard?")) return true;
      const perm = pageAccess[href];
      if (perm !== undefined && perm !== null) {
        return perm !== "none";
      }
      if (exceptionPaths.includes(href) || isProcurementPath(href)) return true;
      return false;
    };

    return routes
      .map(route => {
        if (route.subItems) {
          return {
            ...route,
            subItems: route.subItems.filter(sub => hasAccess(sub.href))
          };
        }
        return route;
      })
      .filter(route => {
        if (route.isSubmenu) {
          return route.subItems && route.subItems.length > 0;
        }
        return hasAccess(route.href);
      });
  };

  // Submenu logic removed

  // Get accessible routes
  const accessibleRoutes = getAccessibleRoutes();

  if (!showLayout) {
    return <>{children}</>;
  }

  return (
    <div
      className={`flex h-screen overflow-hidden bg-[#FAF6F0] selection:bg-gold-200 selection:text-leather-950`}
    >
      {/* Sidebar for desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-leather-200 bg-white md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-gold-400/20 px-4 bg-gradient-to-r from-leather-800 to-leather-700">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 font-bold text-cream-100"
          >
            <img src={aceLogo} alt="Sapid Design Logo" className="h-8 w-8 rounded-full object-cover border border-gold-400/50 ring-1 ring-gold-400/30" />
            <span className="tracking-wide font-serif">Sapid Design</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto thin-scrollbar p-2">
          <ul className="space-y-1">
            {accessibleRoutes.map((route) => (
              <li key={route.label}>
                {route.isSubmenu ? (
                  <div className="flex flex-col">
                    <button
                      onClick={() => handleToggleSubmenu(route)}
                      className={`flex items-center justify-between w-full rounded-xl px-3 py-2 text-sm font-medium text-left transition-all ${route.active
                        ? "bg-gradient-to-r from-leather-800 to-leather-700 text-cream-100 shadow-xs border-l-4 border-gold-400 font-semibold"
                        : "text-leather-900 hover:bg-cream-100 hover:text-leather-950"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <route.icon
                          className={`h-4 w-4 ${route.active ? "text-gold-300" : "text-leather-500"}`}
                        />
                        <div className="flex items-center justify-between w-full">
                          <span>{route.label}</span>
                          {route.badge && (
                            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                              {route.badge}
                            </span>
                          )}
                        </div>
                      </div>
                      {route.isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {route.isOpen && (
                      <ul className="mt-1 ml-4 space-y-1 border-l-2 border-leather-200 pl-2">
                        {route.subItems.map((sub) => (
                          <li key={sub.label}>
                            <Link
                              to={sub.href}
                              className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium text-left transition-colors ${sub.active
                                ? "text-leather-950 bg-cream-100 font-bold border-l-2 border-gold-500"
                                : "text-leather-600 hover:text-leather-950 hover:bg-cream-50"
                                }`}
                            >
                              <span className="text-left">{sub.label}</span>
                              {sub.badge && (
                                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                  {sub.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={route.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${route.active
                      ? "bg-gradient-to-r from-leather-800 to-leather-700 text-cream-100 shadow-xs border-l-4 border-gold-400 font-semibold"
                      : "text-leather-900 hover:bg-cream-100 hover:text-leather-950"
                      }`}
                  >
                    <route.icon
                      className={`h-4 w-4 ${route.active ? "text-gold-300" : "text-leather-500"}`}
                    />
                    <div className="flex items-center justify-between w-full">
                      <span>{route.label}</span>
                      {route.badge && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {route.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-leather-200 p-4 bg-cream-100/60">
          <div className="flex flex-col">
            {/* User info section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center overflow-hidden border border-gold-400/40 text-cream-100 shadow-xs">
                  {profileImage ? (
                    <img src={profileImage} alt={username} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-cream-100">
                      {username ? username.charAt(0).toUpperCase() : "U"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-leather-900 truncate">
                    {username || "User"}{" "}
                    {userRole.toLowerCase() === "admin"
                      ? isSuperAdmin
                        ? "(Super Admin)"
                        : "(Admin)"
                      : userRole.toLowerCase() === "hod"
                        ? "(HOD)"
                        : ""}
                  </p>
                  <p className="text-xs text-leather-600 truncate">
                    {userEmail || "user@example.com"}
                  </p>
                </div>
              </div>

              {/* Dark mode toggle (if available) */}
              {toggleDarkMode && (
                <button
                  onClick={toggleDarkMode}
                  className="text-leather-700 hover:text-leather-950 p-1.5 rounded-full hover:bg-cream-200 transition-colors"
                >
                  {darkMode ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                  )}
                  <span className="sr-only">
                    {darkMode ? "Light mode" : "Dark mode"}
                  </span>
                </button>
              )}
            </div>

            {/* Logout button positioned below user info */}
            <div className="mt-2 flex justify-center">
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-leather-700 hover:text-leather-950 px-2.5 py-1 rounded-lg hover:bg-cream-200 text-xs font-semibold transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile System Launcher Toggle Button */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden absolute left-3.5 top-3.5 z-[110] text-leather-800 p-2 rounded-xl bg-white border border-leather-200 shadow-soft hover:bg-cream-50 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        aria-label="Toggle Systems Launcher"
      >
        <LayoutGrid className="h-4 w-4 text-gold-600" />
        <span className="text-[11px] font-bold text-leather-800 hidden xs:inline">Systems</span>
      </button>

      {/* Mobile System Launcher Drawer / Modal (Level 1 System Home Screen) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="fixed inset-0 bg-leather-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 w-[88%] max-w-sm bg-white shadow-2xl flex flex-col z-10 overflow-hidden">
            {/* Drawer Header */}
            <div className="flex h-16 items-center justify-between border-b border-leather-100 px-4 bg-white">
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 font-bold text-leather-900"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <img src={aceLogo} alt="Sapid Design Logo" className="h-8 w-8 rounded-full object-cover border border-gold-400/40" />
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold tracking-tight font-serif">Sapid Design</span>
                  <span className="text-[10px] font-medium text-leather-500 -mt-0.5">Systems Launcher</span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-leather-400 hover:text-leather-800 hover:bg-cream-100 transition-colors cursor-pointer"
                aria-label="Close launcher"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body: ONLY system names & tiles (No page-level detail) */}
            <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-4 bg-white">
              <div className="rounded-2xl border border-leather-100 bg-cream-50/40 p-1">
                <MobileSystemLauncher
                  menuCounts={menuCounts}
                  onClose={() => setIsMobileMenuOpen(false)}
                  pageAccess={pageAccess}
                  userRole={userRole}
                />
              </div>
            </div>

            {/* Drawer Footer with User Info and Logout */}
            <div className="border-t border-leather-100 p-3.5 bg-cream-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-leather-800 text-cream-100 border border-gold-400/30 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
                    {profileImage ? (
                      <img src={profileImage} alt={username} className="h-full w-full object-cover" />
                    ) : (
                      <span>{username ? username.charAt(0).toUpperCase() : "U"}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-leather-900 truncate">
                      {username || "User"}
                    </p>
                    <p className="text-[11px] text-leather-600 truncate">
                      {userEmail || "user@example.com"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-rose-700 hover:text-rose-900 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[#FAF6F0]">
        <header className="flex h-16 items-center justify-between border-b border-leather-200 bg-white px-4 md:px-6 shadow-xs z-30">
          <div className="flex md:hidden w-8"></div>
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-leather-900 via-leather-700 to-gold-600 bg-clip-text text-transparent font-serif tracking-wide">
              Sapid Design
            </h1>
            <p className="text-[10px] text-leather-600 font-semibold uppercase tracking-[0.25em] -mt-0.5 hidden xs:block">
              Sapid Design
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-[10px] font-bold text-leather-500 uppercase tracking-widest">Welcome</span>
              <span className="text-sm font-bold text-leather-900 -mt-1">Hello, {username || 'User'}</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-leather-800 to-leather-700 flex items-center justify-center shadow-md border-2 border-white ring-2 ring-gold-400/30 overflow-hidden">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={username}
                  className="h-full w-full object-cover"
                  onError={() => {
                    console.error("❌ AdminLayout Image Failed to Load:", profileImage);
                    setProfileImage(""); // Fallback to initials
                  }}
                />
              ) : (
                <span className="text-cream-100 text-sm font-bold uppercase">{username ? username.charAt(0) : 'U'}</span>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto thin-scrollbar overflow-x-hidden px-4 pb-4 md:px-6 md:pb-6 bg-[#FAF6F0] pb-20 md:pb-6">
          {children}
        </main>

        <div className="hidden md:flex bg-gradient-to-r from-leather-950 via-leather-900 to-leather-950 h-5 items-center justify-center px-4 shadow-md z-40 border-t border-gold-500/30">
          <a
            href="https://www.botivate.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-cream-200 font-medium tracking-[0.2em] uppercase hover:underline hover:text-gold-300 transition-colors"
          >
            Powered by <span className="font-bold text-gold-400">Botivate</span>
          </a>
        </div>

        {/* Fixed Bottom Navigation for Mobile */}
        <MobileBottomNav
          accessibleRoutes={accessibleRoutes}
          onOpenLauncher={() => setIsMobileMenuOpen(true)}
          isLauncherOpen={isMobileMenuOpen}
        />

        {/* User Popup */}
        {isUserPopupOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-leather-950/60 backdrop-blur-xs p-4 transition-all duration-300">
            <div className="bg-white rounded-3xl w-full max-w-[340px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-leather-200">
              {/* Header Gradient */}
              <div className="h-32 bg-gradient-to-br from-leather-900 via-leather-800 to-leather-700 relative border-b border-gold-400/30">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
                <button
                  onClick={() => setIsUserPopupOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all hover:rotate-90 z-10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Profile Info */}
              <div className="px-8 pb-8 text-center bg-white">
                <div className="relative -mt-16 mb-6 flex justify-center">
                  <div className="h-28 w-28 rounded-full bg-white p-1.5 shadow-2xl ring-4 ring-gold-400/30">
                    <div className="h-full w-full rounded-full bg-gradient-to-tr from-leather-800 to-leather-700 flex items-center justify-center overflow-hidden border-2 border-white shadow-inner">
                      {profileImage ? (
                        <img src={profileImage} alt={username} className="h-full w-full object-cover transform hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <span className="text-4xl font-bold text-cream-100 uppercase tracking-tighter">
                          {username ? username.charAt(0) : "U"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-leather-950 tracking-tight mb-1 font-serif">
                      {username || "User"}
                    </h3>
                    <div className="flex justify-center flex-wrap gap-2">
                      <span className="text-[10px] font-bold text-leather-800 uppercase tracking-[0.2em] px-3 py-1 bg-cream-100 rounded-full border border-gold-400/40">
                        {userRole?.toLowerCase() === "admin" ? (isSuperAdmin ? "Super Admin" : "Administrator") : userRole?.toLowerCase() === "hod" ? "HOD / Supervisor" : "Staff"}
                      </span>
                    </div>
                  </div>

                  <div className="py-3 px-4 bg-cream-50 rounded-2xl flex items-center justify-center gap-2 border border-leather-200">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-semibold text-leather-600 truncate">{userEmail || "user@example.com"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setIsUserPopupOpen(false)}
                    className="flex justify-center items-center py-3.5 px-4 rounded-2xl text-xs font-bold text-leather-600 border border-leather-200 hover:bg-cream-50 hover:text-leather-900 transition-all active:scale-95 uppercase tracking-wider"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl text-xs font-bold text-cream-100 bg-gradient-to-r from-leather-800 to-leather-700 hover:from-leather-900 hover:to-leather-800 border border-gold-500/30 shadow-md hover:shadow-gold-300/20 transition-all active:scale-95 uppercase tracking-wider"
                  >
                    Logout <LogOut size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
