/* global process */
import { createClient } from "@supabase/supabase-js";

// Supabase configuration matching project environment
const SUPABASE_URL = "https://bgdwjhabcvjwdpadrkdi.supabase.co";
const SUPABASE_KEY = "sb_publishable_-QfMXyh5ap4dMcDT0iqwXg_ct__fyK9";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const REPORT_DEFAULT_PERMISSIONS = {
  "/dashboard": "read",
  "/dashboard/reports/sample": "read",
  "/dashboard/reports/production": "read",
  "/dashboard/reports/procurement": "read",
  "/dashboard/reports/checklist": "read",
};

async function backfillReportPermissions() {
  const isDryRun = process.argv.includes("--dry-run");
  console.log(`[Backfill] Starting report permissions migration (Dry Run: ${isDryRun})...\n`);

  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, user_name, role, page_access");

    if (error) {
      console.error("[Backfill] Error fetching users:", error);
      process.exit(1);
    }

    console.log(`[Backfill] Found ${users.length} users in database.`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      let pageAccess = {};
      if (user.page_access) {
        try {
          pageAccess =
            typeof user.page_access === "object"
              ? { ...user.page_access }
              : JSON.parse(user.page_access);
        } catch (e) {
          console.warn(`[Backfill] Failed to parse page_access for ${user.user_name}, starting with empty object.`);
        }
      }

      const roleLower = (user.role || "user").toLowerCase();
      let needsUpdate = false;

      // Ensure every user has entries for the reports
      for (const [key, defaultVal] of Object.entries(REPORT_DEFAULT_PERMISSIONS)) {
        if (!pageAccess[key]) {
          // If admin, grant write; if non-admin, grant read
          pageAccess[key] = roleLower === "admin" ? "write" : defaultVal;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        console.log(`[Backfill] User '${user.user_name}' (ID: ${user.id}, Role: ${user.role}) needs update.`);
        const updatedValue = typeof user.page_access === "object" ? pageAccess : JSON.stringify(pageAccess);

        if (!isDryRun) {
          const { error: updateError } = await supabase
            .from("users")
            .update({ page_access: updatedValue })
            .eq("id", user.id);

          if (updateError) {
            console.error(`[Backfill] Failed to update user '${user.user_name}':`, updateError);
          } else {
            console.log(`[Backfill] Successfully updated '${user.user_name}'.`);
            updatedCount++;
          }
        } else {
          updatedCount++;
        }
      } else {
        console.log(`[Backfill] User '${user.user_name}' already has report permissions. Skipped.`);
        skippedCount++;
      }
    }

    console.log(`\n[Backfill] Summary: ${updatedCount} users ${isDryRun ? "would be updated" : "updated"}, ${skippedCount} skipped.`);
  } catch (err) {
    console.error("[Backfill] Unexpected error:", err);
    process.exit(1);
  }
}

backfillReportPermissions();
