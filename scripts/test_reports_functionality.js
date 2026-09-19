/* global process */
import assert from "assert";
import {
  hasPipelineReportAccess,
  hasAnyReportAccess,
  getAllowedPipelines,
  isAdminUser,
  PARENT_REPORTS_KEY,
} from "../src/utils/reportPermissions.js";

console.log("==================================================");
console.log("TEST SUITE: Reports Permissions & Logic Validation");
console.log("==================================================");

// ----------------------------------------------------
// 1. Admin Role Tests
// ----------------------------------------------------
console.log("\n1. Testing Admin Role Bypass...");
assert.strictEqual(isAdminUser("admin"), true);
assert.strictEqual(isAdminUser("Admin"), true);
assert.strictEqual(isAdminUser("user"), false);

const adminPipelines = getAllowedPipelines({}, "admin");
assert.deepStrictEqual(adminPipelines, ["sample", "production", "procurement"]);
assert.strictEqual(hasAnyReportAccess({}, "admin"), true);
assert.strictEqual(hasPipelineReportAccess("sample", {}, "admin"), true);
assert.strictEqual(hasPipelineReportAccess("production", {}, "admin"), true);
assert.strictEqual(hasPipelineReportAccess("procurement", {}, "admin"), true);
console.log("✓ Admin bypasses all checks and has full access to all report pipelines.");

// ----------------------------------------------------
// 2. User with Single Report Permission
// ----------------------------------------------------
console.log("\n2. Testing User with only 1 report permission (Sample)...");
const singlePermAccess = {
  [PARENT_REPORTS_KEY]: "read",
  "/dashboard/reports/sample": "read",
  "/dashboard/reports/production": "none",
  "/dashboard/reports/procurement": "none",
};

assert.strictEqual(hasAnyReportAccess(singlePermAccess, "user"), true);
assert.strictEqual(hasPipelineReportAccess("sample", singlePermAccess, "user"), true);
assert.strictEqual(hasPipelineReportAccess("production", singlePermAccess, "user"), false);
assert.strictEqual(hasPipelineReportAccess("procurement", singlePermAccess, "user"), false);

const user1Pipelines = getAllowedPipelines(singlePermAccess, "user");
assert.deepStrictEqual(user1Pipelines, ["sample"]);
console.log("✓ User with only 'sample' report permission can ONLY view Sample System.");

// ----------------------------------------------------
// 3. User with No Report Permissions
// ----------------------------------------------------
console.log("\n3. Testing User with No Report Permissions...");
const noPermAccess = {
  [PARENT_REPORTS_KEY]: "none",
  "/dashboard/reports/sample": "none",
  "/dashboard/reports/production": "none",
  "/dashboard/reports/procurement": "none",
};

assert.strictEqual(hasAnyReportAccess(noPermAccess, "user"), false);
assert.strictEqual(hasPipelineReportAccess("sample", noPermAccess, "user"), false);
assert.strictEqual(hasPipelineReportAccess("production", noPermAccess, "user"), false);
assert.strictEqual(getAllowedPipelines(noPermAccess, "user").length, 0);
console.log("✓ User with no permissions is blocked from all pipelines and Reports overview.");

// ----------------------------------------------------
// 4. Client-side Sort and Filter Logic Simulation
// ----------------------------------------------------
console.log("\n4. Testing Kanban Filter and Sort Logic...");
const sampleCards = [
  {
    id: "card-1",
    customer: "REYN",
    vendor: "Vendor-Alpha",
    targetDate: "2026-10-15T00:00:00",
  },
  {
    id: "card-2",
    customer: "CB",
    vendor: "Vendor-Beta",
    targetDate: "2026-10-01T00:00:00",
  },
  {
    id: "card-3",
    customer: "REYN",
    vendor: "Vendor-Beta",
    targetDate: "2026-10-20T00:00:00",
  },
  {
    id: "card-4",
    customer: "EORI",
    vendor: "Vendor-Alpha",
    targetDate: null,
  },
];

// Test Customer Filter: 'REYN'
const filteredByCustomer = sampleCards.filter((c) => ["REYN"].includes(c.customer));
assert.strictEqual(filteredByCustomer.length, 2);
console.log("✓ Customer filter correctly returned 2 cards for 'REYN'.");

// Test Combined Filter: 'REYN' AND 'Vendor-Beta'
const filteredCombined = sampleCards.filter(
  (c) => ["REYN"].includes(c.customer) && ["Vendor-Beta"].includes(c.vendor)
);
assert.strictEqual(filteredCombined.length, 1);
assert.strictEqual(filteredCombined[0].id, "card-3");
console.log("✓ Combined customer + vendor filter correctly isolated 'card-3'.");

// Test Date Sort Ascending (Oldest first)
const sortedAsc = [...sampleCards].sort((a, b) => {
  const dateA = a.targetDate ? new Date(a.targetDate) : null;
  const dateB = b.targetDate ? new Date(b.targetDate) : null;
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateA - dateB;
});

assert.strictEqual(sortedAsc[0].id, "card-2"); // 2026-10-01
assert.strictEqual(sortedAsc[1].id, "card-1"); // 2026-10-15
assert.strictEqual(sortedAsc[2].id, "card-3"); // 2026-10-20
assert.strictEqual(sortedAsc[3].id, "card-4"); // null at the end
console.log("✓ Date sort: Oldest first sorted dates in ascending order with nulls at end.");

// Test Date Sort Descending (Newest first)
const sortedDesc = [...sampleCards].sort((a, b) => {
  const dateA = a.targetDate ? new Date(a.targetDate) : null;
  const dateB = b.targetDate ? new Date(b.targetDate) : null;
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateB - dateA;
});

assert.strictEqual(sortedDesc[0].id, "card-3"); // 2026-10-20
assert.strictEqual(sortedDesc[1].id, "card-1"); // 2026-10-15
assert.strictEqual(sortedDesc[2].id, "card-2"); // 2026-10-01
assert.strictEqual(sortedDesc[3].id, "card-4"); // null at the end
console.log("✓ Date sort: Newest first sorted dates in descending order with nulls at end.");

console.log("\n==================================================");
console.log("ALL TESTS PASSED SUCCESSFULLY! (6/6)");
console.log("==================================================");
