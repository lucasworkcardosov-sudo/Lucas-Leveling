import { createClient } from '@supabase/supabase-js';

// Uso estrito de import.meta.env para Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log de debug para identificar falhas no ambiente (Vercel/Cloud Run)
if (process.env.NODE_ENV === 'production') {
  console.log("Supabase URL status:", supabaseUrl ? "Presente" : "AUSENTE");
  console.log("Supabase Anon Key status:", supabaseAnonKey ? "Presente" : "AUSENTE");
}

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl !== 'undefined' && 
  supabaseUrl.startsWith('https://') &&
  !!supabaseAnonKey &&
  supabaseAnonKey !== 'undefined' &&
  supabaseAnonKey.length > 20;

// Validação de segurança solicitada pelo usuário
if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.error("Erro: Chaves do Supabase não encontradas no ambiente.");
  // Apenas exibe alerta se estivermos no navegador e não houver chaves
  if (window.location.hostname !== 'localhost') {
     console.warn("DICA: Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente da Vercel.");
  }
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'
);
