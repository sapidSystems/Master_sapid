/**
 * Granular Report Permissions Definition & Helpers
 *
 * Pattern: Consistent with other modules in Sapid Design's:
 * - Permissions are stored in users.page_access as JSON: { [path]: 'none' | 'read' | 'write' }
 * - Role 'admin' automatically bypasses all restrictions.
 */

export const PARENT_REPORTS_KEY = "/dashboard";

export const REPORT_SYSTEMS = [
  {
    id: "sample",
    name: "Sample System",
    shortName: "Samples",
    permissionKey: "/dashboard/reports/sample",
    label: "Sample System Report",
    description: "Sampling lifecycle, NPD handover & buyer dispatch.",
    stagesCount: "4 Stages",
  },
  {
    id: "production",
    name: "Production Planning & Monitoring",
    shortName: "Production",
    permissionKey: "/dashboard/reports/production",
    label: "Production Planning Report",
    description: "8-stage manufacturing milestone pipeline for work orders.",
    stagesCount: "8 Stages",
  },
  {
    id: "procurement",
    name: "Procurement System",
    shortName: "Procurement",
    permissionKey: "/dashboard/reports/procurement",
    label: "Procurement System Report",
    description: "Leather development, materials & packaging tracking.",
    stagesCount: "4 Modules",
  },
];

/**
 * Safely parse page_access JSON from string or object
 */
export const parsePageAccess = (access) => {
  if (!access) return {};
  if (typeof access === "object") return access;
  try {
    return JSON.parse(access);
  } catch (e) {
    console.error("Failed to parse page_access:", e);
    return {};
  }
};

/**
 * Check if the user is an admin
 */
export const isAdminUser = (role) => {
  return (role || "").toString().toLowerCase() === "admin";
};

/**
 * Check if the user has permission to view a specific pipeline report
 * @param {string} pipelineId - 'sample' | 'production' | 'procurement' | 'checklist'
 * @param {object|string} pageAccess - users.page_access map
 * @param {string} role - user role (e.g. 'admin', 'user', 'hod')
 */
export const hasPipelineReportAccess = (pipelineId, pageAccess, role) => {
  if (isAdminUser(role)) return true;

  const access = parsePageAccess(pageAccess);

  // If parent /dashboard is explicitly revoked ('none'), user cannot view any reports
  if (access[PARENT_REPORTS_KEY] === "none") {
    return false;
  }

  const sys = REPORT_SYSTEMS.find((s) => s.id === pipelineId);
  if (!sys) return false;

  const perm = access[sys.permissionKey];

  // If granular report permission exists, check if it is not 'none'
  if (perm !== undefined && perm !== null) {
    return perm !== "none";
  }

  // Fallback for transition before granular permissions are set:
  // If parent /dashboard is explicitly granted ('read' or 'write'), allow access
  const parentPerm = access[PARENT_REPORTS_KEY];
  if (parentPerm === "read" || parentPerm === "write") {
    return true;
  }

  return false;
};

/**
 * Check if user has permission to view at least one report
 */
export const hasAnyReportAccess = (pageAccess, role) => {
  if (isAdminUser(role)) return true;

  const access = parsePageAccess(pageAccess);
  if (access[PARENT_REPORTS_KEY] === "none") {
    return false;
  }

  return REPORT_SYSTEMS.some((sys) => hasPipelineReportAccess(sys.id, access, role));
};

/**
 * Get list of pipeline IDs the user is allowed to view
 */
export const getAllowedPipelines = (pageAccess, role) => {
  if (isAdminUser(role)) {
    return REPORT_SYSTEMS.map((s) => s.id);
  }

  const access = parsePageAccess(pageAccess);
  return REPORT_SYSTEMS.filter((sys) => hasPipelineReportAccess(sys.id, access, role)).map(
    (s) => s.id
  );
};
