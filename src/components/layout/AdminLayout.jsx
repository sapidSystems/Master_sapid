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
} from "lucide-react";

export default function AdminLayout({ children, darkMode, toggleDarkMode, showLayout = true }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list: notifications } = useSelector((state) => state.notifications);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChecklistSubmenuOpen, setIsChecklistSubmenuOpen] = useState(true);
  const [isSampleSubmenuOpen, setIsSampleSubmenuOpen] = useState(false);
  const [isBulkSubmenuOpen, setIsBulkSubmenuOpen] = useState(false);
  const [isProcurementSubmenuOpen, setIsProcurementSubmenuOpen] = useState(false);
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
    productionPlanning: null
  });

  const handleToggleSubmenu = (clickedRoute) => {
    const nextState = !clickedRoute.isOpen;

    const path = location.pathname;
    const isChecklist = [
      "/dashboard/admin", "/dashboard/notifications", "/dashboard/quick-task",
      "/dashboard/assign-task", "/dashboard/delegation", "/dashboard/task",
      "/dashboard/calendar", "/dashboard/holiday-list", "/dashboard/working-day-calendar",
      "/dashboard/admin-approval", "/dashboard/training-video"
    ].some(p => path === p || path.startsWith(p + "/"));

    const isSample = [
      "/dashboard/sample-dashboard", "/dashboard/sample-management"
    ].some(p => path === p || path.startsWith(p + "/"));

    const isBulk = [
      "/dashboard/bulk-dashboard", "/dashboard/bulk-order"
    ].some(p => path === p || path.startsWith(p + "/"));

    const isProcurement = path.startsWith("/dashboard/procurement");

    // Only close others if they are NOT the active route's submenu
    if (clickedRoute.setIsOpen === setIsChecklistSubmenuOpen) {
      if (!isSample) setIsSampleSubmenuOpen(false);
      if (!isBulk) setIsBulkSubmenuOpen(false);
      if (!isProcurement) setIsProcurementSubmenuOpen(false);
    } else if (clickedRoute.setIsOpen === setIsSampleSubmenuOpen) {
      if (!isChecklist) setIsChecklistSubmenuOpen(false);
      if (!isBulk) setIsBulkSubmenuOpen(false);
      if (!isProcurement) setIsProcurementSubmenuOpen(false);
    } else if (clickedRoute.setIsOpen === setIsBulkSubmenuOpen) {
      if (!isChecklist) setIsChecklistSubmenuOpen(false);
      if (!isSample) setIsSampleSubmenuOpen(false);
      if (!isProcurement) setIsProcurementSubmenuOpen(false);
    } else if (clickedRoute.setIsOpen === setIsProcurementSubmenuOpen) {
      if (!isChecklist) setIsChecklistSubmenuOpen(false);
      if (!isSample) setIsSampleSubmenuOpen(false);
      if (!isBulk) setIsBulkSubmenuOpen(false);
    }

    clickedRoute.setIsOpen(nextState);
  };


  // Check authentication on component mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("user-name");
    const storedRole = localStorage.getItem("role");
    const storedEmail = localStorage.getItem("email_id");

    if (!storedUsername) {
      // Redirect to login if not authenticated
      navigate("/login");
      return;
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
      const activeAccess = JSON.parse(localStorage.getItem("page_access") || "{}");

      const exceptionPaths = [
        "/dashboard/admin",
        "/dashboard/notifications",
        "/dashboard/training-video",
        "/dashboard/procurement"
      ];

      const isException = exceptionPaths.some(p => path === p || path.startsWith(p + "/"));

      if (!isException) {
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

      setMenuCounts({
        quickTask: pendingChecklistCount,
        delegation: delegationCount || 0,
        task: taskCount,
        adminApproval: approvalCount,
        sampleManagement: sampleManagementCount || 0,
        productionPlanning: productionPlanningCount || 0
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

  // Fetch notifications globally for badge count
  useEffect(() => {
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("user-id");
    if (role) {
      dispatch(fetchNotifications({ role: role.toLowerCase(), userId }));
    }
  }, [dispatch, location.pathname]);

  // Set initial submenu states based on current location
  useEffect(() => {
    const path = location.pathname;
    const checklistPaths = [
      "/dashboard/admin",
      "/dashboard/notifications",
      "/dashboard/quick-task",
      "/dashboard/assign-task",
      "/dashboard/delegation",
      "/dashboard/task",
      "/dashboard/calendar",
      "/dashboard/holiday-list",
      "/dashboard/working-day-calendar",
      "/dashboard/admin-approval",
      "/dashboard/training-video"
    ];
    const samplePaths = [
      "/dashboard/sample-dashboard",
      "/dashboard/sample-management"
    ];
    const bulkPaths = [
      "/dashboard/bulk-dashboard",
      "/dashboard/bulk-order"
    ];

    const isChecklist = checklistPaths.some(p => path === p || path.startsWith(p + "/"));
    const isSample = samplePaths.some(p => path === p || path.startsWith(p + "/"));
    const isBulk = bulkPaths.some(p => path === p || path.startsWith(p + "/"));
    const isProcurement = path.startsWith("/dashboard/procurement");

    if (isChecklist) setIsChecklistSubmenuOpen(true);
    if (isSample) setIsSampleSubmenuOpen(true);
    if (isBulk) setIsBulkSubmenuOpen(true);
    if (isProcurement) setIsProcurementSubmenuOpen(true);
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
      label: "Checklist",
      icon: ClipboardList,
      showFor: ["admin", "user", "HOD"],
      isSubmenu: true,
      isOpen: isChecklistSubmenuOpen,
      setIsOpen: setIsChecklistSubmenuOpen,
      badge: ((menuCounts.delegation || 0) + (menuCounts.task || 0) + (menuCounts.adminApproval || 0)) || null,
      active: location.pathname === "/dashboard/admin" ||
        location.pathname === "/dashboard/notifications" ||
        location.pathname === "/dashboard/quick-task" ||
        location.pathname === "/dashboard/assign-task" ||
        location.pathname === "/dashboard/delegation" ||
        location.pathname === "/dashboard/task" ||
        location.pathname === "/dashboard/calendar" ||
        location.pathname === "/dashboard/holiday-list" ||
        location.pathname === "/dashboard/working-day-calendar" ||
        location.pathname === "/dashboard/admin-approval" ||
        location.pathname === "/dashboard/training-video",
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
      active: location.pathname === "/dashboard/sample-dashboard" ||
        location.pathname === "/dashboard/sample-management",
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
      label: "Production Planning and Monitoring",
      icon: TrendingUp,
      showFor: ["admin", "user", "HOD"],
      isSubmenu: true,
      isOpen: isBulkSubmenuOpen,
      setIsOpen: setIsBulkSubmenuOpen,
      badge: menuCounts.productionPlanning || null,
      active: location.pathname === "/dashboard/bulk-dashboard" ||
        location.pathname === "/dashboard/bulk-order",
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
      badge: null,
      active: location.pathname.startsWith("/dashboard/procurement"),
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
        },
        {
          href: "/dashboard/procurement/daily-leather",
          label: "Daily Leather Proc",
          active: location.pathname === "/dashboard/procurement/daily-leather",
          showFor: ["admin", "user", "HOD"],
        },
        {
          href: "/dashboard/procurement/material",
          label: "Daily Material Proc",
          active: location.pathname === "/dashboard/procurement/material",
          showFor: ["admin", "user", "HOD"],
        },
        {
          href: "/dashboard/procurement/packaging",
          label: "Daily Packaging Proc",
          active: location.pathname === "/dashboard/procurement/packaging",
          showFor: ["admin", "user", "HOD"],
        },
        {
          href: "/dashboard/procurement/activity",
          label: "Activity Log",
          active: location.pathname === "/dashboard/procurement/activity",
          showFor: ["admin", "user", "HOD"],
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
      "/dashboard/training-video",
      "/dashboard/procurement"
    ];

    const hasAccess = (href) => {
      if (exceptionPaths.includes(href)) return true;
      const perm = pageAccess[href];
      return perm && perm !== "none";
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
      className={`flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50`}
    >
      {/* Sidebar for desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-blue-200 bg-white md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-blue-200 px-4 bg-gradient-to-r from-blue-100 to-purple-100">
          <Link
            to="/dashboard/admin"
            className="flex items-center gap-2 font-semibold text-blue-700"
          >
            <img src={aceLogo} alt="TaskDesk Logo" className="h-8 w-8 rounded-full object-cover border border-blue-200" />
            <span>TaskDesk</span>
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
                      className={`flex items-center justify-between w-full rounded-md px-3 py-2 text-sm font-medium text-left transition-colors ${route.active
                        ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                        : "text-gray-700 hover:bg-blue-50"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <route.icon
                          className={`h-4 w-4 ${route.active ? "text-blue-600" : ""}`}
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
                      <ul className="mt-1 ml-4 space-y-1 border-l-2 border-blue-50 pl-2">
                        {route.subItems.map((sub) => (
                          <li key={sub.label}>
                            <Link
                              to={sub.href}
                              className={`flex items-center justify-between rounded-md px-3 py-1.5 text-xs font-medium text-left transition-colors ${sub.active
                                ? "text-blue-700 bg-blue-50 font-semibold"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${route.active
                      ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                      : "text-gray-700 hover:bg-blue-50"
                      }`}
                  >
                    <route.icon
                      className={`h-4 w-4 ${route.active ? "text-blue-600" : ""}`}
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
        <div className="border-t border-blue-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex flex-col">
            {/* User info section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center overflow-hidden border border-blue-100">
                  {profileImage ? (
                    <img src={profileImage} alt={username} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-black">
                      {username ? username.charAt(0).toUpperCase() : "U"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-700 truncate">
                    {username || "User"}{" "}
                    {userRole.toLowerCase() === "admin"
                      ? isSuperAdmin
                        ? "(Super Admin)"
                        : "(Admin)"
                      : userRole.toLowerCase() === "hod"
                        ? "(HOD)"
                        : ""}
                  </p>
                  <p className="text-xs text-blue-600 truncate">
                    {userEmail || "user@example.com"}
                  </p>
                </div>
              </div>

              {/* Dark mode toggle (if available) */}
              {toggleDarkMode && (
                <button
                  onClick={toggleDarkMode}
                  className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
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
                className="flex items-center gap-1 text-blue-700 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-100 text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button and sidebar - similar structure as desktop but with mobile classes */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden absolute left-4 top-3 z-[110] text-blue-700 p-2 rounded-md hover:bg-blue-100"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </button>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <div className="flex h-14 items-center border-b border-blue-200 px-4 bg-gradient-to-r from-blue-100 to-purple-100">
              <Link
                to="/dashboard/admin"
                className="flex items-center gap-2 font-semibold text-blue-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <img src={aceLogo} alt="TaskDesk Logo" className="h-8 w-8 rounded-full object-cover border border-blue-200" />
                <span>TaskDesk</span>
              </Link>
            </div>
            <nav className="flex-1 overflow-y-auto thin-scrollbar p-2 bg-white">
              <ul className="space-y-1">
                {accessibleRoutes.map((route) => (
                  <li key={route.label}>
                    {route.isSubmenu ? (
                      <div className="flex flex-col">
                        <button
                          onClick={() => handleToggleSubmenu(route)}
                          className={`flex items-center justify-between w-full rounded-md px-3 py-2 text-sm font-medium text-left transition-colors ${route.active
                            ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                            : "text-gray-700 hover:bg-blue-50"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <route.icon
                              className={`h-4 w-4 ${route.active ? "text-blue-600" : ""}`}
                            />
                            {route.label}
                          </div>
                          {route.isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        {route.isOpen && (
                          <ul className="mt-1 ml-4 space-y-1 border-l-2 border-blue-50 pl-2">
                            {route.subItems.map((sub) => (
                              <li key={sub.label}>
                                <Link
                                  to={sub.href}
                                  className={`flex items-center justify-between rounded-md px-3 py-1.5 text-xs font-medium text-left transition-colors ${sub.active
                                    ? "text-blue-700 bg-blue-50 font-semibold"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                    }`}
                                  onClick={() => setIsMobileMenuOpen(false)}
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
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${route.active
                          ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                          : "text-gray-700 hover:bg-blue-50"
                          }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <route.icon
                          className={`h-4 w-4 ${route.active ? "text-blue-600" : ""
                            }`}
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
            <div className="border-t border-blue-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center overflow-hidden border border-blue-100">
                    {profileImage ? (
                      <img src={profileImage} alt={username} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-medium text-black">
                        {username ? username.charAt(0).toUpperCase() : "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      {username || "User"}{" "}
                      {userRole === "admin"
                        ? isSuperAdmin
                          ? "(Super Admin)"
                          : "(Admin)"
                        : userRole === "HOD"
                          ? "(HOD)"
                          : ""}
                    </p>
                    <p className="text-xs text-blue-600">
                      {userEmail || "user@example.com"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {toggleDarkMode && (
                    <button
                      onClick={toggleDarkMode}
                      className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
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
                            d="M20.354 15.354A9 9 0 018.646 3.646A9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                          />
                        </svg>
                      )}
                      <span className="sr-only">
                        {darkMode ? "Light mode" : "Dark mode"}
                      </span>
                    </button>
                  )}

                </div>
              </div>
              <div className="mt-2 flex justify-center">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-blue-700 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-100 text-sm"
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
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-purple-100 bg-white px-4 md:px-6 shadow-sm z-30">
          <div className="flex md:hidden w-8"></div>
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
              TaskDesk
            </h1>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em] -mt-1 hidden xs:block">
              TaskDesk
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Welcome</span>
              <span className="text-sm font-black text-purple-700 -mt-1">Hello, {username || 'User'}</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-purple-100/50 overflow-hidden">
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
                <span className="text-white text-sm font-black uppercase">{username ? username.charAt(0) : 'U'}</span>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto thin-scrollbar overflow-x-hidden px-4 pb-4 md:px-6 md:pb-6 bg-gradient-to-br from-blue-50/50 to-purple-50/50 pb-24 md:pb-6">
          {children}
        </main>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-5 flex items-center justify-center px-4 shadow-md z-40">
          <a
            href="https://www.botivate.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-white/90 font-medium tracking-[0.2em] uppercase hover:underline hover:text-white transition-colors"
          >
            Powered by <span className="font-bold">Botivate</span>
          </a>
        </div>

        {/* Premium Bottom Navigation for Mobile */}
        <div className="md:hidden fixed bottom-6 left-4 right-4 h-16 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 flex items-center justify-around px-2">
          <Link
            to="/dashboard/admin"
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${location.pathname === "/dashboard/admin"
              ? "text-purple-600 bg-purple-50"
              : "text-gray-400 hover:text-purple-400"
              }`}
          >
            <Home size={22} strokeWidth={location.pathname === "/dashboard/admin" ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-bold">Home</span>
          </Link>



          <Link
            to="/dashboard/task"
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${location.pathname === "/dashboard/task"
              ? "text-purple-600 bg-purple-50"
              : "text-gray-400 hover:text-purple-400"
              }`}
          >
            <CalendarCheck size={22} strokeWidth={location.pathname === "/dashboard/task" ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-bold">Tasks</span>
          </Link>

          {(userRole?.toUpperCase() === "ADMIN" || userRole?.toUpperCase() === "HOD") && (
            <div className="relative -mt-12">
              <Link
                to="/dashboard/assign-task"
                className="flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl shadow-lg shadow-purple-200 text-white transform active:scale-90 transition-all duration-300 border-4 border-blue-50"
              >
                <CirclePlus size={28} strokeWidth={2.5} />
              </Link>
            </div>
          )}

          <Link
            to="/dashboard/delegation"
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${location.pathname === "/dashboard/delegation"
              ? "text-purple-600 bg-purple-50"
              : "text-gray-400 hover:text-purple-400"
              }`}
          >
            <BookmarkCheck size={22} strokeWidth={location.pathname === "/dashboard/delegation" ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-bold">Status</span>
          </Link>

          <button
            onClick={() => setIsUserPopupOpen(true)}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-gray-400 hover:text-purple-400 transition-all"
          >
            <UserRound size={22} strokeWidth={2} />
            <span className="text-[10px] mt-1 font-bold">Profile</span>
          </button>
        </div>

        {/* User Popup */}
        {isUserPopupOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 transition-all duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-[340px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/50">
              {/* Header Gradient */}
              <div className="h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
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
                  <div className="h-28 w-28 rounded-full bg-white p-1.5 shadow-2xl ring-4 ring-white/30">
                    <div className="h-full w-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden border-2 border-white shadow-inner">
                      {profileImage ? (
                        <img src={profileImage} alt={username} className="h-full w-full object-cover transform hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <span className="text-4xl font-black text-white uppercase tracking-tighter">
                          {username ? username.charAt(0) : "U"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
                      {username || "User"}
                    </h3>
                    <div className="flex justify-center flex-wrap gap-2">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100/50">
                        {userRole?.toLowerCase() === "admin" ? (isSuperAdmin ? "Super Admin" : "Administrator") : userRole?.toLowerCase() === "hod" ? "HOD / Supervisor" : "Staff"}
                      </span>
                    </div>
                  </div>

                  <div className="py-3 px-4 bg-gray-50 rounded-2xl flex items-center justify-center gap-2 border border-gray-100">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-gray-500 truncate">{userEmail || "user@example.com"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setIsUserPopupOpen(false)}
                    className="flex justify-center items-center py-3.5 px-4 rounded-2xl text-xs font-black text-gray-400 border-2 border-gray-50 hover:bg-gray-50 hover:text-gray-600 transition-all active:scale-95 uppercase tracking-widest"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)] hover:shadow-indigo-200 transition-all active:scale-95 uppercase tracking-widest"
                  >
                    Logout <LogOut size={14} strokeWidth={3} />
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
