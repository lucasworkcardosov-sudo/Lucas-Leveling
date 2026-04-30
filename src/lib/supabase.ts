import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseUrl.length > 10 &&
  supabaseUrl.startsWith('https://') && 
  supabaseAnonKey &&
  supabaseAnonKey.length > 10;

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder'
);

if (!isSupabaseConfigured) {
  console.error('SUPABASE CONFIGURATION ERROR: Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment/secrets.');
}
