import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Profile } from '../types';
import { LogOut, Users, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

export const AdminPage = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (!error && data) setStudents(data);
    setLoading(false);
  };

  const handleApprove = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', id);

    if (!error) fetchStudents();
  };

  const handleLogout = () => supabase.auth.signOut();

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="text-lime-400" size={32} />
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">Painel do <span className="text-lime-400">Mestre</span></h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-none">Workout Quest Admin</p>
          </div>
        </div>
        <Button onClick={handleLogout} variant="ghost" className="text-zinc-400 hover:text-white">
          <LogOut size={20} className="mr-2" /> Sair
        </Button>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="bg-zinc-900 border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(163,230,53,1)]">
              <Users className="text-lime-400 mb-2" />
              <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest">Total de Alunos</h3>
              <p className="text-4xl font-black">{students.length}</p>
           </div>
           <div className="bg-zinc-900 border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(251,191,36,1)]">
              <CheckCircle className="text-amber-400 mb-2" />
              <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest">Pendentes</h3>
              <p className="text-4xl font-black">{students.filter(s => s.status === 'pending').length}</p>
           </div>
        </div>

        <div className="bg-zinc-900 border-4 border-black overflow-hidden">
          <div className="p-4 bg-black border-b-2 border-black flex items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Gestão de Candidatos</h3>
          </div>
          
          <div className="divide-y-2 divide-black">
            {students.map((student) => (
              <div key={student.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/50 transition-colors">
                <div>
                  <h4 className="text-lg font-black uppercase italic">{student.full_name}</h4>
                  <p className="text-xs text-zinc-500 font-medium">{student.email}</p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-zinc-800 border border-zinc-700">{student.goal || 'Sem objetivo'}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase py-0.5 px-2 border",
                      student.status === 'approved' ? "bg-lime-900/20 border-lime-500 text-lime-400" : 
                      student.status === 'pending' ? "bg-amber-900/20 border-amber-500 text-amber-400" :
                      "bg-red-900/20 border-red-500 text-red-400"
                    )}>
                      {student.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {student.status === 'pending' && (
                    <>
                      <Button onClick={() => handleApprove(student.id, 'approved')} variant="secondary" className="px-4 py-2 text-xs">
                        Aprovar
                      </Button>
                      <Button onClick={() => handleApprove(student.id, 'rejected')} variant="outline" className="px-4 py-2 text-xs border-zinc-700 text-zinc-400">
                        Rejeitar
                      </Button>
                    </>
                  )}
                  {student.status === 'approved' && (
                    <Button variant="outline" className="px-4 py-2 text-xs border-zinc-700 text-zinc-400 opacity-50 cursor-not-allowed">
                      Ver Treino
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {students.length === 0 && !loading && (
              <div className="p-12 text-center text-zinc-500 font-bold uppercase text-xs tracking-widest">
                Nenhum aluno encontrado.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
