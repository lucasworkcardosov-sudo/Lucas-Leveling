import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Calendar, Trophy, Zap } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface ProgressPageProps {
  profile: Profile;
}

export const ProgressPage = ({ profile }: ProgressPageProps) => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const handleBack = () => {
    if (profile.role === 'admin') navigate('/admin');
    else navigate('/dashboard');
  };

  const displayName = profile.nickname || profile.full_name || profile.email;
  const initials = (profile.nickname || profile.full_name || profile.email || '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_history')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: true });

      if (error) {
        // If table doesn't exist, just show empty
        console.warn('Workout history not found or empty:', error.message);
        setHistory([]);
        return;
      }

      // Acumular XP para o gráfico de evolução
      let totalXp = profile.xp || 0; // Começar com o XP atual do perfil se quiser, mas o gráfico pede histórico
      let accumulatedXp = 0;
      
      const chartData = data?.map((item: any) => {
        accumulatedXp += item.xp_gained;
        return {
          date: new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          xp: accumulatedXp,
          gained: item.xp_gained
        };
      });

      setHistory(chartData || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white font-sans">
      <header className="border-b-4 border-black bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <button onClick={handleBack} className="p-2 hover:bg-zinc-100 border-2 border-transparent hover:border-black transition-all text-black">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center space-x-2">
            <Dumbbell className="text-lime-500" strokeWidth={3} />
            <span className="font-black uppercase tracking-tighter text-2xl italic text-black font-press text-[14px]">QUEST WORKOUT</span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-3">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-zinc-400 leading-none">Atleta</p>
            <p className="text-xs font-black uppercase text-black truncate max-w-[150px]">{displayName}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-900 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-xs font-black text-white italic">{initials}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-zinc-800 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(163,230,53,1)]">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-8 flex items-center">
                <Calendar className="mr-3 text-lime-400" /> Curva de Crescimento
              </h2>
              
              <div className="h-[300px] w-full">
                {history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a3e635" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#888" 
                        fontSize={12} 
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#888" 
                        fontSize={12} 
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '2px solid #a3e635', borderRadius: '0px' }}
                        itemStyle={{ color: '#a3e635', fontWeight: 'bold' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="xp" 
                        stroke="#a3e635" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorXp)" 
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full border-2 border-dashed border-zinc-700 text-zinc-500 font-bold italic">
                    Dados insuficientes para gerar o gráfico.
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white text-black border-4 border-black p-8">
               <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-6">Histórico Recente</h2>
               <div className="space-y-4">
                  {history.slice(-5).reverse().map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 border-2 border-black">
                       <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-black text-lime-400 flex items-center justify-center font-black italic border-2 border-black">
                             +{item.gained}
                          </div>
                          <div>
                             <p className="font-black uppercase tracking-tighter text-lg">Quest Finalizada</p>
                             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.date}</p>
                          </div>
                       </div>
                       <Trophy className="text-zinc-300" size={24} />
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-lime-400 text-black border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                <Zap size={48} fill="currentColor" strokeWidth={0} className="mb-4" />
                <h3 className="text-xs font-black uppercase tracking-widest mb-1 opacity-60">Status Atual</h3>
                <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-6">Level {profile.level}</h2>
                <div className="space-y-4">
                   <div className="flex justify-between font-black uppercase text-sm">
                      <span>Próximo Level</span>
                      <span>{profile.xp} / {profile.level * 500} XP</span>
                   </div>
                   <div className="h-6 w-full bg-black/10 border-2 border-black overflow-hidden relative">
                      <div 
                        className="h-full bg-black transition-all duration-1000"
                        style={{ width: `${(profile.xp % 500) / 5}%` }}
                      />
                   </div>
                   <p className="text-[10px] font-bold italic uppercase leading-tight">Faltam {500 - (profile.xp % 500)} XP para você subir de nível e ganhar novas recompensas.</p>
                </div>
             </div>

             <div className="bg-zinc-800 border-4 border-black p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6 border-b border-zinc-700 pb-2">Conquistas</h3>
                <div className="grid grid-cols-4 gap-4">
                   {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                     <div key={i} className={`aspect-square border-2 border-black flex items-center justify-center ${i <= profile.level ? 'bg-lime-400 text-black' : 'bg-zinc-900 border-zinc-700 opacity-30 grayscale'}`}>
                        <Trophy size={16} />
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};
