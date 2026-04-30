import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL loaded:", supabaseUrl);

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl !== 'undefined' && 
  supabaseUrl.length > 10 &&
  !!supabaseAnonKey &&
  supabaseAnonKey !== 'undefined' &&
  supabaseAnonKey.length > 10;

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder'
);

if (!isSupabaseConfigured) {
  console.error('SUPABASE CONFIGURATION ERROR: Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment/secrets.');
}
