import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://ruowtcwsskjfxzuvqlnd.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_g4sQhpDOzpvl7Yr2Fn_dcQ_pyYOVk6l';

export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseUrl.includes('supabase.co') &&
  supabaseAnonKey && 
  supabaseAnonKey.startsWith('sb_');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error('SUPABASE CONFIGURATION ERROR: Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment/secrets.');
}
