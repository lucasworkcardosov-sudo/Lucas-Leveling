import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Exercise, Profile } from '../types';
import { ArrowLeft, Play, Info, Dumbbell, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface ExerciseDetailProps {
  profile: Profile;
}

export const ExerciseDetail = ({ profile }: ExerciseDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const handleBack = () => {
    if (profile.role === 'admin') navigate('/admin');
    else navigate(-1);
  };

  const displayName = profile.nickname || profile.full_name || profile.email;
  const initials = (profile.nickname || profile.full_name || profile.email || '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  useEffect(() => {
    fetchExercise();
  }, [id]);

  const fetchExercise = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setExercise(data);
    } catch (error) {
      console.error('Error fetching exercise:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="h-12 w-12 border-4 border-white border-t-lime-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 p-6 text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-6 italic">Exercício não encontrado</h1>
        <Button onClick={handleBack} variant="secondary">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white font-sans">
      <header className="border-b-4 border-black bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <button onClick={handleBack} className="p-2 hover:bg-zinc-100 border-2 border-transparent hover:border-black transition-all text-black">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center space-x-2">
            <Dumbbell className="text-lime-500" strokeWidth={3} />
            <span className="font-black uppercase tracking-tighter text-2xl italic text-black">DETALHE.</span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-3">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-zinc-400 leading-none">Perfil</p>
            <p className="text-xs font-black uppercase text-black truncate max-w-[120px]">{displayName}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-900 border-2 border-black flex items-center justify-center">
            <span className="text-xs font-black text-white italic">{initials}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="mb-10 text-center md:text-left">
           <h3 className="text-xs font-black uppercase tracking-[0.3em] text-lime-400 mb-2">Instrução Técnica</h3>
           <h1 className="text-6xl font-black uppercase tracking-tighter italic mb-4 leading-none">
             {exercise.name}
           </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="bg-black border-4 border-black aspect-video flex items-center justify-center relative overflow-hidden group shadow-[12px_12px_0px_0px_rgba(163,230,53,1)]">
               {exercise.media_url ? (
                 <img 
                   src={exercise.media_url} 
                   alt={exercise.name} 
                   className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                 />
               ) : (
                 <Play size={80} className="text-zinc-800" />
               )}
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-lime-400 text-black flex items-center justify-center border-4 border-black hover:scale-110 transition-transform cursor-pointer">
                    <Play fill="currentColor" size={32} />
                  </div>
               </div>
            </div>

            <div className="bg-zinc-800 border-4 border-black p-6">
               <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center text-lime-400">
                 <ShieldCheck className="mr-2" size={18} /> Músculo Alvo
               </h3>
               <div className="flex flex-wrap gap-2">
                  <span className="px-4 py-1 bg-black text-white font-black uppercase italic border-2 border-zinc-700 tracking-tighter">
                    {exercise.muscle_group}
                  </span>
               </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white text-black border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-4 flex items-center">
                 <Info className="mr-2 text-lime-500" /> Execução
               </h3>
               <div className="prose prose-zinc prose-sm">
                  <p className="font-bold leading-relaxed italic text-zinc-600">
                    {exercise.description || 'Nenhuma descrição técnica disponível para este exercício. Consulte seu professor para orientação personalizada.'}
                  </p>
               </div>
               
               <div className="mt-8 pt-8 border-t-2 border-zinc-100 space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-black text-lime-400 flex items-center justify-center font-black text-xs shrink-0">1</div>
                    <p className="text-sm font-medium">Mantenha a postura ereta e o core ativado durante todo o movimento.</p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-black text-lime-400 flex items-center justify-center font-black text-xs shrink-0">2</div>
                    <p className="text-sm font-medium">Controle a fase excêntrica do movimento para maior tempo sob tensão.</p>
                  </div>
               </div>
            </div>
            
            <Button onClick={() => navigate(-1)} className="w-full h-16 text-xl tracking-widest">
               OK, ENTENDI!
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
