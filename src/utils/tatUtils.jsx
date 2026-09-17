import supabase from "../SupabaseClient";

export const DEFAULT_TAT_CONFIGS = [
  {
    system_id: "sample",
    system_name: "Sample System",
    page_name: "Sample Management",
    page_path: "/dashboard/sample-management",
    tat_days: 5,
    description: "Sample inquiry to dispatch SLA",
  },
  {
    system_id: "production",
    system_name: "Production Planning and Monitoring",
    page_name: "Production Planning and Monitoring",
    page_path: "/dashboard/bulk-order",
    tat_days: 15,
    description: "Work order production completion SLA",
  },
  {
    system_id: "procurement",
    system_name: "Procurement System",
    page_name: "New Leather Development",
    page_path: "/dashboard/procurement/new-leather",
    tat_days: 7,
    description: "Swatch and lab dip receipt SLA",
  },
  {
    system_id: "procurement",
    system_name: "Procurement System",
    page_name: "Daily Leather Procurement",
    page_path: "/dashboard/procurement/daily-leather",
    tat_days: 4,
    description: "Stock check and order receipt SLA",
  },
  {
    system_id: "procurement",
    system_name: "Procurement System",
    page_name: "Daily Material Procurement",
    page_path: "/dashboard/procurement/material",
    tat_days: 3,
    description: "Material indent and store update SLA",
  },
  {
    system_id: "procurement",
    system_name: "Procurement System",
    page_name: "Packaging Procurement",
    page_path: "/dashboard/procurement/packaging",
    tat_days: 5,
    description: "Packaging release and receipt SLA",
  },
];

/**
 * Fetch all TAT configurations from Supabase or fallback to defaults
 */
export async function fetchTatConfigs() {
  try {
    const { data, error } = await supabase
      .from("tat_master")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn("Could not fetch tat_master, using default configurations:", err);
  }
  return DEFAULT_TAT_CONFIGS;
}

/**
 * Get TAT days for a specific page path
 */
export function getTatDays(tatConfigs = [], pagePath, fallbackDays = 0) {
  if (!pagePath) return fallbackDays;
  const match = tatConfigs.find(
    (c) =>
      c.page_path === pagePath ||
      (pagePath.startsWith(c.page_path) && c.page_path !== "/dashboard/procurement")
  );
  if (match && typeof match.tat_days === "number") {
    return match.tat_days;
  }
  const defaultMatch = DEFAULT_TAT_CONFIGS.find((c) => c.page_path === pagePath);
  return defaultMatch ? defaultMatch.tat_days : fallbackDays;
}

/**
 * Calculate TAT status and delays
 */
export function calculateTatStatus({ tatDays, startDate, endDate, isCompleted }) {
  if (tatDays === undefined || tatDays === null || !startDate) {
    return {
      hasData: false,
      tatDays: null,
      statusText: "—",
      color: "neutral",
    };
  }

  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    return {
      hasData: false,
      tatDays,
      statusText: "—",
      color: "neutral",
    };
  }

  // Calculate planned target date
  const plannedDate = new Date(start);
  plannedDate.setDate(plannedDate.getDate() + Number(tatDays));

  // Format planned date string
  const plannedDateStr = plannedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const now = new Date();
  const end = endDate ? new Date(endDate) : null;
  const completed = Boolean(isCompleted || (end && !isNaN(end.getTime())));

  if (completed && end && !isNaN(end.getTime())) {
    // Task is done
    const diffMs = end.getTime() - start.getTime();
    const actualDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    const delayDays = actualDays - tatDays;

    if (delayDays > 0) {
      return {
        hasData: true,
        tatDays,
        plannedDateStr,
        isCompleted: true,
        isDelayed: true,
        delayDays,
        statusText: `+${delayDays}d Delay`,
        color: "red",
      };
    } else {
      return {
        hasData: true,
        tatDays,
        plannedDateStr,
        isCompleted: true,
        isDelayed: false,
        delayDays,
        statusText: delayDays < 0 ? `${Math.abs(delayDays)}d Early` : "On Time",
        color: "green",
      };
    }
  } else {
    // Task is pending / ongoing
    const diffMs = now.getTime() - start.getTime();
    const elapsedDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    const delayDays = elapsedDays - tatDays;

    if (delayDays > 0) {
      return {
        hasData: true,
        tatDays,
        plannedDateStr,
        isCompleted: false,
        isDelayed: true,
        delayDays,
        statusText: `+${delayDays}d Delay`,
        color: "red",
      };
    } else {
      const remainingDays = tatDays - elapsedDays;
      return {
        hasData: true,
        tatDays,
        plannedDateStr,
        isCompleted: false,
        isDelayed: false,
        delayDays,
        statusText: remainingDays === 0 ? "Due Today" : `${remainingDays}d Left`,
        color: "green",
      };
    }
  }
}

/**
 * Reusable Badge Component for "TAT Planned"
 */
export function TatPlannedCell({ tatDays, startDate }) {
  if (tatDays === null || tatDays === undefined) {
    return <span className="text-gray-400 font-medium">—</span>;
  }

  let targetDateText = null;
  if (startDate) {
    const s = new Date(startDate);
    if (!isNaN(s.getTime())) {
      s.setDate(s.getDate() + Number(tatDays));
      targetDateText = s.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });
    }
  }

  return (
    <div className="flex flex-col whitespace-nowrap">
      <span className="font-bold text-gray-900 text-xs">
        {tatDays} {tatDays === 1 ? "Day" : "Days"}
      </span>
      {targetDateText && (
        <span className="text-[10px] text-gray-400 font-medium">
          Target: {targetDateText}
        </span>
      )}
    </div>
  );
}

/**
 * Reusable Badge Component for "TAT Delay"
 */
export function TatDelayCell({ status, tatStatus }) {
  const currentStatus = status || tatStatus;
  if (!currentStatus || !currentStatus.hasData) {
    return <span className="text-gray-400 font-medium">—</span>;
  }

  if (currentStatus.color === "red") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap shadow-2xs">
        {currentStatus.statusText}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shadow-2xs">
      {currentStatus.statusText}
    </span>
  );
}
