import React, { useState } from 'react';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { LogOut, Dumbbell, Trophy, ShieldAlert, CheckCircle2, Search } from 'lucide-react';
import { getAlternateExercise } from '../services/geminiService';

interface DashboardProps {
  profile: Profile;
  onRefresh: () => Promise<void>;
}

export const Dashboard = ({ profile, onRefresh }: DashboardProps) => {
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => supabase.auth.signOut();

  const handleFinishWorkout = async () => {
    setLoading(true);
    try {
      const newXp = (profile.xp || 0) + 100;
      const newLevel = Math.floor(newXp / 500) + 1;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ xp: newXp, level: newLevel })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      const { error: historyError } = await supabase
        .from('workout_history')
        .insert({
          student_id: profile.id,
          xp_gained: 100
        });

      if (historyError) throw historyError;

      await onRefresh();
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

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b-4 border-black bg-white sticky top-0 z-10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Dumbbell className="text-lime-500" strokeWidth={3} />
          <span className="font-black uppercase tracking-tighter text-2xl italic">WQ.</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
           <div className="flex items-center space-x-2 bg-black text-white px-4 py-1 rounded-full border-2 border-black">
              <Trophy size={16} className="text-lime-400" />
              <span className="text-xs font-black uppercase tracking-wider">Level {profile.level}</span>
              <span className="text-[10px] text-zinc-400">{profile.xp} XP</span>
           </div>
           <Button onClick={handleLogout} variant="ghost" className="p-2 h-auto">
             <LogOut size={20} />
           </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
             <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Bem-vindo de volta,</h3>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">{profile.full_name.split(' ')[0]}</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-zinc-500 uppercase tracking-tighter">Progresso Level {profile.level}</span>
                    <span className="font-black">{(profile.xp || 0) % 100}%</span>
                  </div>
                  <div className="h-4 w-full bg-zinc-100 border-2 border-black overflow-hidden">
                    <div 
                      className="h-full bg-lime-400 border-r-2 border-black transition-all duration-1000" 
                      style={{ width: `${(profile.xp || 0) % 100}%` }}
                    />
                  </div>
                </div>
             </div>

             <div className="bg-zinc-900 text-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(163,230,53,1)]">
                <h3 className="text-sm font-black uppercase tracking-widest text-lime-400 mb-4 flex items-center">
                  <ShieldAlert size={18} className="mr-2" /> Destaque do Dia
                </h3>
                <p className="text-lg font-medium leading-tight">
                  Seu treino foca em <span className="text-lime-400 underline">{profile.goal || 'Seu Objetivo'}</span>. Mantenha a consistência para ganhar bônus de XP!
                </p>
             </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
             <div className="bg-white border-4 border-black p-8">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter italic">Treino de <span className="text-lime-500">Hoje</span></h2>
                    <p className="text-zinc-500 font-bold uppercase text-xs mt-1">Siga sua rotina personalizada.</p>
                  </div>
                  <CheckCircle2 size={40} className="text-zinc-200" />
                </div>

                <div className="border-2 border-dashed border-zinc-200 rounded-xl p-12 text-center">
                  <p className="text-zinc-400 font-medium mb-6 italic">Clique abaixo para concluir seu treino e ganhar XP.</p>
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

             <div className="bg-white border-4 border-black p-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 flex items-center italic">
                  <Search size={24} className="mr-2 text-lime-500" /> Substituição <span className="ml-2 text-lime-500">IA</span>
                </h3>
                <p className="text-sm text-zinc-600 mb-6 font-medium">
                  Aparelho ocupado? Nossa IA sugere outro exercício na hora para você não parar o ritmo.
                </p>
                
                <div className="p-6 bg-zinc-50 border-2 border-black relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 bg-black text-lime-400 text-[10px] font-black uppercase rotate-45 translate-x-3 -translate-y-1">
                    Ativo
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Simulador de Troca</p>
                  
                  {aiSuggestion ? (
                    <div className="bg-lime-50 p-4 border-2 border-lime-400 mb-4 animate-in fade-in slide-in-from-bottom-2">
                       <p className="text-sm font-bold text-black">{aiSuggestion}</p>
                    </div>
                  ) : null}

                  <Button onClick={testAISuggestion} isLoading={aiLoading} variant="outline" className="w-full text-xs">
                    {aiSuggestion ? "Sugerir Outro" : "Trocar Equipamento Ocupado"}
                  </Button>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};
