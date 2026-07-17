import { createClient } from "@supabase/supabase-js";

const supabaseURL = "https://bgdwjhabcvjwdpadrkdi.supabase.co";
const supabaseKey = "sb_publishable_-QfMXyh5ap4dMcDT0iqwXg_ct__fyK9";
const supabase = createClient(supabaseURL, supabaseKey);

async function inspect() {
  const { data, error } = await supabase
    .from("users")
    .select("id, user_name, role, page_access");

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  console.log("Found users:");
  for (const user of data) {
    console.log("----------------------------------------");
    console.log(`User: ${user.user_name} (ID: ${user.id}, Role: ${user.role})`);
    console.log(`Type of page_access: ${typeof user.page_access}`);
    console.log("Raw page_access value:");
    console.log(JSON.stringify(user.page_access));
    console.log("Length of page_access:", user.page_access ? JSON.stringify(user.page_access).length : 0);
  }
}

inspect();
