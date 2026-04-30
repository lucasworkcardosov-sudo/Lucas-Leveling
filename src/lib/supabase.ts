import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Definição das constantes com fallback para a URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ruowtcwsskjfxzuvqlnd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação de segurança da Anon Key
if (!supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    const errorMsg = "Erro Crítico: Chave Anon não encontrada. O sistema não pode iniciar sem a VITE_SUPABASE_ANON_KEY.";
    console.error(errorMsg);
    // Alert amigável para o usuário no navegador
    if (window.location.hostname !== 'localhost') {
      // Usando console.warn para garantir visibilidade sem bloquear a thread se possível, 
      // mas o usuário pediu "alerta na tela".
      alert(errorMsg);
    }
  }
}

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && supabaseAnonKey.length > 20;

let _supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  console.log("Conectando ao Supabase...");
  try {
    _supabaseInstance = createClient(supabaseUrl, supabaseAnonKey as string);
  } catch (error) {
    console.error("Falha ao criar cliente Supabase:", error);
  }
}

export const supabase = _supabaseInstance as SupabaseClient;

export const getSupabase = (): SupabaseClient => {
  if (!_supabaseInstance) {
    throw new Error('Supabase não inicializado ou chaves ausentes.');
  }
  return _supabaseInstance;
};
