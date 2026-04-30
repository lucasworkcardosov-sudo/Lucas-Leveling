import { createClient } from '@supabase/supabase-js';

// Uso estrito de import.meta.env com tratamento para espaços em branco (trim)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Log de debug para ambiente de produção para verificar valores (com máscara para segurança)
if (typeof window !== 'undefined') {
  console.log("Supabase URL carregada:", supabaseUrl || "AUSENTE");
  if (supabaseAnonKey) {
    console.log("Supabase Anon Key detectada (Início):", supabaseAnonKey.substring(0, 10) + "...");
  } else {
    console.warn("Supabase Anon Key: AUSENTE ou VAZIA");
  }
}

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl !== 'undefined' && 
  supabaseUrl.startsWith('https://') &&
  !!supabaseAnonKey &&
  supabaseAnonKey !== 'undefined' &&
  supabaseAnonKey.length > 20;

// Inicialização segura
let supabaseInstance;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log("✓ Cliente Supabase iniciado com sucesso.");
  } catch (error) {
    console.error("CRITICAL: Erro ao chamar createClient do Supabase:", error);
    supabaseInstance = null as any;
  }
} else {
  // Mock para evitar erros de referência no carregamento inicial
  // O App.tsx lidará com a exibição da tela de erro
  supabaseInstance = createClient(
    'https://placeholder-project.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'
  );
}

export const supabase = supabaseInstance;
