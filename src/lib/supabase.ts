import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Captura direta com tratamento rígido de strings
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = String(rawUrl || '').trim();
const supabaseAnonKey = String(rawKey || '').trim();

// Log de depuração (debug) solicitado
if (typeof window !== 'undefined') {
  console.log("Conectando ao Supabase em:", supabaseUrl || "URL_VAZIA");
  if (!supabaseUrl || supabaseUrl === 'undefined' || supabaseUrl.includes('seu-projeto')) {
    console.warn("DICA: Verifique VITE_SUPABASE_URL nas variáveis da Vercel.");
  }
}

// Validação rigorosa
export const isSupabaseConfigured = 
  supabaseUrl.length > 0 && 
  supabaseUrl !== 'undefined' && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('seu-projeto') &&
  supabaseAnonKey.length > 20 &&
  supabaseAnonKey !== 'undefined' &&
  !supabaseAnonKey.includes('sua-chave');

// Inicialização defensiva: Só chama createClient se as chaves forem válidas
let _supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    _supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error("Erro ao inicializar createClient:", err);
  }
} else {
  console.warn("Aguardando chaves de API... (Supabase não inicializado)");
}

// Exportamos o cliente. Se não configurado, será null.
// Nota: O App.tsx deve lidar com o caso de ser null.
export const supabase = _supabaseInstance as SupabaseClient;

export const getSupabase = (): SupabaseClient => {
  if (!_supabaseInstance) {
    throw new Error('Aguardando variáveis de ambiente (Supabase client is null)');
  }
  return _supabaseInstance;
};
