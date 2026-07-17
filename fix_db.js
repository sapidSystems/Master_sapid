import { createClient } from "@supabase/supabase-js";

const supabaseURL = "https://bgdwjhabcvjwdpadrkdi.supabase.co";
const supabaseKey = "sb_publishable_-QfMXyh5ap4dMcDT0iqwXg_ct__fyK9";
const supabase = createClient(supabaseURL, supabaseKey);

async function fix() {
  const { data, error } = await supabase
    .from("users")
    .select("id, user_name, page_access");

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  console.log("Processing users...");
  for (const user of data) {
    const rawAccess = user.page_access;
    if (!rawAccess) continue;

    console.log(`User: ${user.user_name} (ID: ${user.id})`);
    console.log(`Original: ${rawAccess}`);

    let cleaned = rawAccess;
    
    // Check if it's double-serialized
    try {
      // Try to parse it. If it succeeds and returns a string, parse it again.
      let parsed = JSON.parse(cleaned);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      cleaned = JSON.stringify(parsed);
      console.log("Successfully parsed/cleaned standard JSON.");
    } catch (e) {
      console.log("Standard parsing failed. Attempting string cleanup...");
      // Replace literal backslashes followed by quote or double backslashes
      let temp = rawAccess.replace(/\\"/g, '"').replace(/\\\\"/g, '"');
      
      // If it has outer quotes, strip them
      if (temp.startsWith('"') && temp.endsWith('"')) {
        temp = temp.substring(1, temp.length - 1);
      }
      
      try {
        const parsed = JSON.parse(temp);
        cleaned = JSON.stringify(parsed);
        console.log("Cleanup succeeded. Cleaned JSON:", cleaned);
      } catch (err) {
        console.error("Cleanup failed for user", user.user_name, err.message);
        continue;
      }
    }

    if (cleaned !== rawAccess) {
      console.log(`Updating database for ${user.user_name}...`);
      const { error: updateError } = await supabase
        .from("users")
        .update({ page_access: cleaned })
        .eq("id", user.id);
      
      if (updateError) {
        console.error(`Error updating user ${user.user_name}:`, updateError);
      } else {
        console.log(`Updated user ${user.user_name} successfully!`);
      }
    } else {
      console.log(`User ${user.user_name} does not need update.`);
    }
  }
}

fix();
