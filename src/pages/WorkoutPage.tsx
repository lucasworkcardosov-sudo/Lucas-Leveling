import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Workout, WorkoutExercise } from '../types';
import { Button } from '../components/ui/Button';
import { Dumbbell, ChevronRight, PlayCircle, Clock, Hash, ArrowLeft, AlertTriangle, X, Info, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getYoutubeEmbedUrl } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { getDynamicAvatar } from '../lib/avatarLibrary';

interface WorkoutPageProps {
  profile: Profile;
}

export const WorkoutPage = ({ profile }: WorkoutPageProps) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<{ name: string, url: string, instructions: string } | null>(null);
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
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Workouts not found or empty:', error.message);
        setWorkouts([]);
        setLoading(false);
        return;
      }
      
      setWorkouts(data || []);
      if (data && data.length > 0) {
        handleSelectWorkout(data[0]);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
      setLoading(false);
    }
  };

  const handleSelectWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setExercises(workout.exercises || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white font-sans">
      <header className="border-b-4 border-black bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <button onClick={handleBack} className="p-2 hover:bg-zinc-100 border-2 border-transparent hover:border-black transition-all">
            <ArrowLeft className="text-black" size={24} />
          </button>
          <div className="flex items-center space-x-2">
            <Dumbbell className="text-lime-500" strokeWidth={3} />
            <span className="font-black uppercase tracking-tighter text-2xl italic text-black font-press text-[14px]">QUEST WORKOUT</span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-3">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-zinc-400 leading-none">Perfil</p>
            <p className="text-xs font-black uppercase text-black truncate max-w-[120px]">{displayName}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-900 border-2 border-black flex items-center justify-center overflow-hidden">
            {profile.avatar_url || getDynamicAvatar(profile) ? (
              <img src={profile.avatar_url || getDynamicAvatar(profile)!} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-xs font-black text-white italic">{initials}</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-2 leading-none">
            Suas <span className="text-lime-400">Dungeons</span>
          </h1>
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Execute cada repetição com perfeição.</p>
        </div>

        {workouts.length > 1 && (
          <div className="flex space-x-4 overflow-x-auto pb-6 mb-8 scrollbar-hide">
            {workouts.map((w) => (
              <button
                key={w.id}
                onClick={() => handleSelectWorkout(w)}
                className={`flex-shrink-0 px-6 py-3 border-4 border-black font-black uppercase tracking-tighter italic text-lg transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] ${
                  selectedWorkout?.id === w.id ? 'bg-lime-400 text-black' : 'bg-white text-black'
                }`}
              >
                {w.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-20">
            <div className="h-12 w-12 border-4 border-white border-t-lime-400 rounded-full animate-spin" />
          </div>
        ) : exercises.length > 0 ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
              <div className="bg-black text-white p-4 shadow-[8px_8px_0px_0px_rgba(163,230,53,1)] transform -rotate-1">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                  {selectedWorkout?.name}
                </h2>
                {selectedWorkout?.division && (
                  <p className="text-lime-400 text-xs font-black uppercase tracking-widest mt-2">
                     Divisão: {selectedWorkout.division}
                  </p>
                )}
              </div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                {exercises.length} Exercícios na Dungeon
              </p>
            </div>

            {exercises.map((we: any, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  if (we.video_url || we.instructions) {
                    setActiveVideo({
                      name: we.name,
                      url: we.video_url || '',
                      instructions: we.instructions || ''
                    });
                  }
                }}
                className="group relative bg-zinc-800 border-4 border-black p-6 hover:bg-zinc-700 transition-all cursor-pointer shadow-[8px_8px_0px_0px_rgba(163,230,53,1)] hover:shadow-none hover:translate-x-[8px] hover:translate-y-[8px]"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-lime-400 text-black font-black text-xl w-10 h-10 flex items-center justify-center border-2 border-black shrink-0 italic">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1 group-hover:text-lime-400 transition-colors">
                        {we.name}
                      </h3>
                      <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                        {we.muscle_group}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:gap-6 bg-black/50 p-3 border-2 border-zinc-700 md:border-transparent group-hover:border-lime-400/30 transition-colors">
                    <div className="text-center min-w-[50px]">
                      <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Séries</p>
                      <div className="flex items-center justify-center space-x-1">
                        <Hash size={14} className="text-lime-400" />
                        <span className="font-black text-lg">{we.sets}</span>
                      </div>
                    </div>
                    <div className="text-center min-w-[50px] border-l-2 border-zinc-700 md:border-x-2 px-3 md:px-6">
                      <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Reps</p>
                      <div className="flex items-center justify-center space-x-1">
                        <PlayCircle size={14} className="text-lime-400" />
                        <span className="font-black text-lg">{we.reps}</span>
                      </div>
                    </div>
                    {we.weight && (
                      <div className="text-center min-w-[50px] border-l-2 border-zinc-700 pr-3 md:pr-6 md:border-r-2 hidden sm:block">
                        <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Carga</p>
                        <div className="flex items-center justify-center space-x-1">
                          <Scale size={14} className="text-lime-400" />
                          <span className="font-black text-lg">{we.weight}</span>
                        </div>
                      </div>
                    )}
                    <div className="text-center min-w-[50px] border-l-2 border-zinc-700 pl-3 md:pl-0">
                      <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Descanso</p>
                      <div className="flex items-center justify-center space-x-1">
                        <Clock size={14} className="text-lime-400" />
                        <span className="font-black text-lg">{we.rest_time}s</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden md:block">
                    <PlayCircle size={24} className="text-zinc-600 group-hover:text-lime-400 transition-colors" />
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-10">
              <Button 
                onClick={handleBack} 
                className="w-full h-16 text-xl tracking-widest hover:bg-zinc-800 hover:text-white"
              >
                VOLTAR AO DASHBOARD
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white border-4 border-black p-12 text-center shadow-[16px_16px_0px_0px_rgba(163,230,53,1)]">
            <AlertTriangle className="mx-auto text-black mb-4" size={64} />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic text-black mb-4">Nenhum Treino Ativo</h2>
            <p className="text-zinc-600 font-bold mb-8">Você ainda não tem exercícios atribuídos. Solicite ao seu professor!</p>
            <Button onClick={handleBack} variant="outline" className="w-full">
              Voltar ao Início
            </Button>
          </div>
        )}
      </main>

      <AnimatePresence>
        {activeVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border-4 border-black w-full max-w-3xl overflow-hidden shadow-[24px_24px_0px_0px_rgba(163,230,53,1)]"
            >
              <div className="bg-black text-white p-6 border-b-4 border-black flex justify-between items-center">
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                   Demonstração: <span className="text-lime-400">{activeVideo.name}</span>
                 </h2>
                 <button onClick={() => setActiveVideo(null)} className="hover:text-lime-400 transition-colors">
                    <X size={32} strokeWidth={3} />
                 </button>
              </div>
              
              <div className="p-1">
                 {(() => {
                   const embedUrl = getYoutubeEmbedUrl(activeVideo.url);
                   if (embedUrl) {
                     return (
                       <div className="aspect-video bg-zinc-900 border-4 border-black">
                         <iframe 
                           src={embedUrl}
                           className="w-full h-full"
                           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                           allowFullScreen
                         />
                       </div>
                     );
                   }
                   return (
                     <div className="aspect-video bg-zinc-100 flex flex-col items-center justify-center text-black p-10 text-center border-4 border-black">
                        <AlertTriangle size={64} className="mb-4 text-lime-500" strokeWidth={3} />
                        <p className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                          VÍDEO INDISPONÍVEL <span className="text-zinc-400 block text-xl mt-2 font-black italic">PARA ESTE EXERCÍCIO</span>
                        </p>
                     </div>
                   );
                 })()}
              </div>

              {activeVideo.instructions && (
                <div className="p-6 bg-zinc-100 border-t-4 border-black">
                  <div className="flex items-center space-x-2 mb-2 text-zinc-500">
                    <Info size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Instruções Técnicas</span>
                  </div>
                  <p className="font-bold text-zinc-800 text-sm italic">{activeVideo.instructions}</p>
                </div>
              )}

              <div className="p-6 bg-white border-t-4 border-black flex justify-end">
                 <Button onClick={() => setActiveVideo(null)} variant="secondary" className="px-12 py-4 h-auto text-xl font-black uppercase italic">
                   Entendi!
                 </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
