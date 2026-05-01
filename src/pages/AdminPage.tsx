import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Profile } from '../types';
import { LogOut, Users, CheckCircle, XCircle, ShieldCheck, Dumbbell, TrendingUp, LayoutList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminPage = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalHistory, setTotalHistory] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, workoutsRes, historyRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false }),
        supabase.from('workouts').select('id', { count: 'exact' }),
        supabase.from('workout_history').select('id', { count: 'exact' })
      ]);

      if (profilesRes.data) setStudents(profilesRes.data);
      if (workoutsRes.count !== null) setTotalWorkouts(workoutsRes.count);
      if (historyRes.count !== null) setTotalHistory(historyRes.count);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', id);

    if (!error) fetchData();
  };

  const handleLogout = () => supabase.auth.signOut();

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans p-6 md:p-10">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div className="flex items-center space-x-4">
          <div className="bg-lime-400 p-2 border-2 border-black rotate-[-3deg] shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <ShieldCheck className="text-black" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Painel <span className="text-lime-400">Geral</span></h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Status do Ecossistema Leveling</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button onClick={() => navigate('/workout')} variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white text-xs">
            Visualizar Interface Aluno
          </Button>
          <Button onClick={handleLogout} variant="ghost" className="text-zinc-500 hover:text-red-400 text-xs uppercase font-black">
            <LogOut size={18} className="mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           <div className="bg-zinc-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(163,230,53,1)]">
              <div className="flex justify-between items-start mb-4">
                <Users className="text-lime-400" size={24} />
                <span className="text-[10px] font-black uppercase bg-lime-400/10 text-lime-400 px-2 py-1 border border-lime-400/20">Ativos</span>
              </div>
              <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Total de Alunos</h3>
              <p className="text-5xl font-black italic tracking-tighter">{students.length}</p>
           </div>

           <div className="bg-zinc-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(251,191,36,1)]">
              <div className="flex justify-between items-start mb-4">
                <CheckCircle className="text-amber-400" size={24} />
                <span className="text-[10px] font-black uppercase bg-amber-400/10 text-amber-400 px-2 py-1 border border-amber-400/20">Ação Necessária</span>
              </div>
              <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Pendentes</h3>
              <p className="text-5xl font-black italic tracking-tighter">{students.filter(s => s.status === 'pending').length}</p>
           </div>

           <div className="bg-zinc-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)]">
              <div className="flex justify-between items-start mb-4">
                <Dumbbell className="text-blue-400" size={24} />
              </div>
              <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Planos de Treino</h3>
              <p className="text-5xl font-black italic tracking-tighter">{totalWorkouts}</p>
           </div>

           <div className="bg-zinc-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(168,85,247,1)]">
              <div className="flex justify-between items-start mb-4">
                <TrendingUp className="text-purple-400" size={24} />
              </div>
              <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Treinos Realizados</h3>
              <p className="text-5xl font-black italic tracking-tighter">{totalHistory}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border-4 border-black overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <div className="p-6 bg-black border-b-4 border-black flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center">
                  <LayoutList className="mr-3 text-lime-400" size={20} /> Gestão de Alunos
                </h3>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 border border-black"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500 border border-black"></div>
                  <div className="w-3 h-3 rounded-full bg-lime-500 border border-black"></div>
                </div>
              </div>
              
              <div className="divide-y-4 divide-black">
                {students.map((student) => (
                  <div key={student.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-zinc-800 transition-colors group">
                    <div className="flex items-center space-x-4">
                       <div className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center font-black text-black italic text-xl group-hover:bg-lime-400 transition-colors">
                          {student.full_name?.charAt(0) || '?'}
                       </div>
                       <div>
                        <h4 className="text-xl font-black uppercase italic group-hover:text-lime-400 transition-colors">{student.full_name}</h4>
                        <div className="flex flex-wrap gap-3 mt-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{student.email}</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-black text-zinc-400 border border-zinc-800">{student.goal || 'No Goal'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      {student.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleApprove(student.id, 'approved')}
                            className="px-4 py-2 bg-lime-400 text-black font-black uppercase text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                          >
                            Aprovar
                          </button>
                          <button 
                            onClick={() => handleApprove(student.id, 'rejected')}
                            className="px-4 py-2 bg-zinc-700 text-white font-black uppercase text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                          >
                            Rejeitar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-4">
                           <span className={cn(
                            "text-[10px] font-black uppercase py-1 px-3 border-2 border-black italic",
                            student.status === 'approved' ? "bg-lime-400 text-black" : "bg-red-500 text-white"
                          )}>
                            {student.status}
                          </span>
                          <button 
                            onClick={() => navigate(`/progress`)} // In a real app we'd pass student.id
                            className="p-2 border-2 border-zinc-800 text-zinc-500 hover:text-white hover:border-white transition-all"
                          >
                            <TrendingUp size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {students.length === 0 && !loading && (
                  <div className="p-20 text-center text-zinc-600 font-black uppercase italic tracking-tighter text-2xl">
                    Silêncio na Academia...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-white text-black border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(163,230,53,1)]">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-6 leading-none">Acesso do <span className="text-lime-500">Mestre</span></h3>
                <p className="text-sm font-bold text-zinc-600 mb-8 leading-tight">Como administrador, você pode navegar pelas páginas dos alunos para verificar a integridade visual e funcional.</p>
                <div className="space-y-4">
                  <Button onClick={() => navigate('/workout')} className="w-full justify-between group">
                    Visualizar Treinos <Dumbbell size={18} className="group-hover:rotate-12 transition-transform" />
                  </Button>
                  <Button onClick={() => navigate('/progress')} variant="secondary" className="w-full justify-between group">
                    Estatísticas Globais <TrendingUp size={18} className="group-hover:scale-110 transition-transform" />
                  </Button>
                </div>
             </div>

             <div className="bg-black border-4 border-lime-400 p-6">
                <h4 className="text-lime-400 font-black uppercase tracking-widest text-xs mb-4 italic">LOG DE ATIVIDADE</h4>
                <div className="space-y-3 opacity-60">
                   <div className="text-[10px] font-mono"><span className="text-zinc-500">[SYSTEM]</span> Monitorando conexões...</div>
                   <div className="text-[10px] font-mono"><span className="text-zinc-500">[AUTH]</span> Admin autenticado.</div>
                   <div className="text-[10px] font-mono"><span className="text-zinc-500">[DB]</span> Sincronização de perfis OK.</div>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
