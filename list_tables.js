async function listTables() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseURL = "https://bgdwjhabcvjwdpadrkdi.supabase.co";
  const supabaseKey = "sb_publishable_-QfMXyh5ap4dMcDT0iqwXg_ct__fyK9";
  const supabase = createClient(supabaseURL, supabaseKey);

  console.log('Fetching table list...');
  
  const commonTables = [
    'users', 'dropdown_options', 'assign_from', 'departments', 
    'checklist', 'delegation', 'maintenance_tasks', 'repair_tasks', 
    'holidays', 'working_day_calender', 'ea_tasks', 'ea_tasks_done',
    'machines', 'machine_entries', 'dropdowns'
  ];
  
  for (const table of commonTables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`Table: ${table} - Count: ${count}`);
    } else {
      if (!error.message.includes('does not exist')) {
        console.log(`Table: ${table} - Error: ${error.message}`);
      }
    }
  }
}

listTables();
