import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Profile } from './types';
import { RegistrationForm } from './components/RegistrationForm';
import { Button } from './components/ui/Button';
import { LogOut, Dumbbell, Trophy, ShieldAlert, CheckCircle2, Search, Settings, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { getAlternateExercise } from './services/geminiService';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => supabase.auth.signOut();

  const handleFinishWorkout = async () => {
    if (!profile) return;
    setLoading(true);
    
    try {
      const newXp = (profile.xp || 0) + 100;
      const newLevel = Math.floor(newXp / 500) + 1; // Ex: A cada 500 XP sobe um nível

      // 1. Atualizar Perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          xp: newXp, 
          level: newLevel 
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // 2. Registrar no Histórico (tabela workout_history do schema)
      const { error: historyError } = await supabase
        .from('workout_history')
        .insert({
          student_id: profile.id,
          xp_gained: 100
        });

      if (historyError) throw historyError;

      // Recarregar dados
      await fetchProfile(profile.id);
      alert('Treino Finalizado! +100 XP conquistados!');
    } catch (error) {
      console.error('Erro ao finalizar treino:', error);
      alert('Erro ao salvar progresso.');
    } finally {
      setLoading(false);
    }
  };

  const testAISuggestion = async () => {
    setAiLoading(true);
    const suggestion = await getAlternateExercise("Supino Inclinado com Barra", "Peitoral Superior");
    setAiSuggestion(suggestion);
    setAiLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="h-12 w-12 border-4 border-black border-t-lime-400 rounded-full animate-spin" />
      </div>
    );
  }

  // --- CONFIGURATION MISSING STATE ---
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] text-center">
        <div className="max-w-xl w-full bg-white border-4 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
          <div className="inline-flex p-4 bg-amber-400 border-2 border-black mb-8">
            <Settings size={48} />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-6">
            Configuração <span className="text-amber-500 underline">Pendente</span>
          </h1>
          <div className="space-y-4 text-left font-medium text-zinc-600 mb-8 border-l-4 border-amber-500 pl-6">
            <p>Para o sistema funcionar, você precisa conectar seu projeto Supabase:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm italic font-bold">
              <li>Acesse o menu <span className="bg-zinc-100 px-1 border border-black">Settings (Engrenagem)</span> no AI Studio.</li>
              <li>Vá em <span className="bg-zinc-100 px-1 border border-black">Secrets</span>.</li>
              <li>Adicione as chaves:</li>
            </ol>
            <div className="bg-zinc-900 text-zinc-300 p-4 font-mono text-[10px] space-y-2 mt-4 border-2 border-black">
              <p className="text-lime-400 font-bold">VITE_SUPABASE_URL="https://seu-projeto.supabase.co"</p>
              <p className="text-lime-400 font-bold">VITE_SUPABASE_ANON_KEY="sua-chave-anon"</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 font-bold uppercase mb-8">Após adicionar, reinicie o servidor ou aguarde a atualização.</p>
          <div className="p-4 bg-amber-50 border-2 border-amber-200 text-amber-700 flex items-start text-xs text-left">
            <AlertTriangle className="mr-3 shrink-0" size={16} />
            <p>Certifique-se de ter executado o SQL de criação das tabelas fornecido anteriormente no Editor SQL do Supabase.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- UNAUTHENTICATED STATE ---
  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        {showRegister ? (
          <div className="w-full">
            <RegistrationForm onComplete={() => setShowRegister(false)} />
            <button 
              onClick={() => setShowRegister(false)}
              className="mt-6 w-full text-xs font-black uppercase underline tracking-widest hover:text-lime-600"
            >
              Já tem uma conta? Entrar
            </button>
          </div>
        ) : (
          <div className="max-w-xl w-full bg-white border-4 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="inline-flex p-4 bg-lime-400 border-2 border-black rotate-3 mb-8">
              <Dumbbell size={48} />
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tighter italic mb-4">
              Workout <span className="text-lime-500 underline">Quest</span>
            </h1>
            <p className="text-xl font-medium text-zinc-600 mb-10 leading-tight">
              Transforme seu suor em experiência. Evolua seu corpo, suba de nível e complete sua jornada fitness.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Button onClick={() => setShowRegister(true)} variant="secondary" className="text-lg">
                Começar Jornada
              </Button>
              <Button variant="outline" className="text-lg" onClick={() => {/* Login Logic */}}>
                Fazer Login
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- PENDING STATUS ---
  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
          <ShieldAlert size={64} className="mx-auto text-amber-500 mb-6" />
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 italic">
            Acesso <span className="text-amber-500">Bloqueado</span>
          </h2>
          <p className="font-medium text-zinc-600 mb-8">
            Seu cadastro foi recebido com sucesso! <br />
            Para garantir a melhor experiência, um treinador precisa aprovar seu perfil e preparar seu primeiro treino.
          </p>
          <div className="p-4 bg-zinc-100 border-2 border-dashed border-zinc-400 rounded-lg animate-pulse mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Status: Pendente de Aprovação</span>
          </div>
          <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Sair da Conta
          </Button>
        </div>
      </div>
    );
  }

  // --- APPROVED DASHBOARD (STUDENT) ---
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b-4 border-black bg-white sticky top-0 z-10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Dumbbell className="text-lime-500" strokeWidth={3} />
          <span className="font-black uppercase tracking-tighter text-2xl italic">WQ.</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
           <div className="flex items-center space-x-2 bg-black text-white px-4 py-1 rounded-full border-2 border-black">
              <Trophy size={16} className="text-lime-400" />
              <span className="text-xs font-black uppercase tracking-wider">Level {profile?.level}</span>
              <span className="text-[10px] text-zinc-400">{profile?.xp} XP</span>
           </div>
           <Button onClick={handleLogout} variant="ghost" className="p-2 h-auto">
             <LogOut size={20} />
           </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: User Info */}
          <div className="space-y-6">
             <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Bem-vindo de volta,</h3>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">{profile?.full_name.split(' ')[0]}</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-zinc-500 uppercase tracking-tighter">Progresso Level {profile?.level}</span>
                    <span className="font-black">{(profile?.xp || 0) % 100}%</span>
                  </div>
                  <div className="h-4 w-full bg-zinc-100 border-2 border-black overflow-hidden">
                    <div 
                      className="h-full bg-lime-400 border-r-2 border-black transition-all duration-1000" 
                      style={{ width: `${(profile?.xp || 0) % 100}%` }}
                    />
                  </div>
                </div>
             </div>

             <div className="bg-zinc-900 text-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(163,230,53,1)]">
                <h3 className="text-sm font-black uppercase tracking-widest text-lime-400 mb-4 flex items-center">
                  <ShieldAlert size={18} className="mr-2" /> Destaque do Dia
                </h3>
                <p className="text-lg font-medium leading-tight">
                  Seu treino foca em <span className="text-lime-400 underline">{profile?.goal || 'Seu Objetivo'}</span>. Mantenha a consistência para ganhar bônus de XP!
                </p>
             </div>
          </div>

          {/* Right Column: Training Preview */}
          <div className="lg:col-span-2 space-y-6">
             <div className="bg-white border-4 border-black p-8">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter italic">Treino de <span className="text-lime-500">Hoje</span></h2>
                    <p className="text-zinc-500 font-bold uppercase text-xs mt-1">Nenhum treino montado ainda.</p>
                  </div>
                  <CheckCircle2 size={40} className="text-zinc-200" />
                </div>

                <div className="border-2 border-dashed border-zinc-200 rounded-xl p-12 text-center">
                  <p className="text-zinc-400 font-medium mb-6 italic">Clique abaixo para simular a conclusão do seu treino personalizado.</p>
                  <Button 
                    onClick={handleFinishWorkout} 
                    variant="secondary" 
                    className="w-full sm:w-auto"
                    isLoading={loading}
                  >
                    Finalizar Treino (+100 XP)
                  </Button>
                </div>
             </div>

             {/* AI Feature Preview */}
             <div className="bg-white border-4 border-black p-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 flex items-center italic">
                  <Search size={24} className="mr-2 text-lime-500" /> Substituição <span className="ml-2 text-lime-500">IA</span>
                </h3>
                <p className="text-sm text-zinc-600 mb-6 font-medium">
                  Aparelho ocupado? Nossa IA sugere outro exercício na hora para você não parar o ritmo.
                </p>
                
                <div className="p-6 bg-zinc-50 border-2 border-black relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 bg-black text-lime-400 text-[10px] font-black uppercase rotate-45 translate-x-3 -translate-y-1">
                    Demo
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Simulação: Supino Inclinado ocupado</p>
                  
                  {aiSuggestion ? (
                    <div className="bg-lime-50 p-4 border-2 border-lime-400 mb-4 animate-in fade-in slide-in-from-bottom-2">
                       <p className="text-sm font-bold text-black">{aiSuggestion}</p>
                    </div>
                  ) : null}

                  <Button onClick={testAISuggestion} isLoading={aiLoading} variant="outline" className="w-full text-xs">
                    {aiSuggestion ? "Gerar outra sugestão" : "Ver como funciona"}
                  </Button>
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
