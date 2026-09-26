import supabase from "../SupabaseClient";

export const DEFAULT_TAT_CONFIGS = [];

/**
 * Fetch all TAT configurations directly from Supabase tat_master table
 */
export async function fetchTatConfigs() {
  try {
    const { data, error } = await supabase
      .from("tat_master")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching tat_master:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Could not fetch tat_master:", err);
    return [];
  }
}

/**
 * Get TAT days for a specific page path from loaded configs, with fallback days
 */
export function getTatDays(tatConfigs = [], pagePath, fallbackDays = 0) {
  if (!pagePath) return fallbackDays;
  const match = (tatConfigs || []).find(
    (c) =>
      c.page_path === pagePath ||
      (pagePath.startsWith(c.page_path) && c.page_path !== "/dashboard/procurement")
  );
  if (match && typeof match.tat_days === "number") {
    return match.tat_days;
  }
  return fallbackDays;
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
