import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bgdwjhabcvjwdpadrkdi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-QfMXyh5ap4dMcDT0iqwXg_ct__fyK9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
