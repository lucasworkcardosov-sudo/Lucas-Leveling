import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Workout, WorkoutExercise } from '../types';
import { Button } from '../components/ui/Button';
import { Dumbbell, ChevronRight, PlayCircle, Clock, Hash, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WorkoutPageProps {
  profile: Profile;
}

export const WorkoutPage = ({ profile }: WorkoutPageProps) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

      if (error) throw error;
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

  const handleSelectWorkout = async (workout: Workout) => {
    setSelectedWorkout(workout);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq('workout_id', workout.id)
        .order('order_index');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching workout exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white font-sans">
      <header className="border-b-4 border-black bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-zinc-100 border-2 border-transparent hover:border-black transition-all">
            <ArrowLeft className="text-black" size={24} />
          </button>
          <div className="flex items-center space-x-2">
            <Dumbbell className="text-lime-500" strokeWidth={3} />
            <span className="font-black uppercase tracking-tighter text-2xl italic text-black">TREINOS.</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-2 leading-none">
            Sua Rotina de <span className="text-lime-400">Ferro</span>
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
            {exercises.map((we, idx) => (
              <div 
                key={we.id}
                onClick={() => navigate(`/exercise/${we.exercise_id}`)}
                className="group relative bg-zinc-800 border-4 border-black p-6 hover:bg-zinc-700 transition-all cursor-pointer shadow-[8px_8px_0px_0px_rgba(163,230,53,1)] hover:shadow-none hover:translate-x-[8px] hover:translate-y-[8px]"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-lime-400 text-black font-black text-xl w-10 h-10 flex items-center justify-center border-2 border-black shrink-0 italic">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1 group-hover:text-lime-400 transition-colors">
                        {we.exercise?.name}
                      </h3>
                      <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                        {we.exercise?.muscle_group}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 bg-black/50 p-3 border-2 border-zinc-700 md:border-transparent group-hover:border-lime-400/30 transition-colors">
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Séries</p>
                      <div className="flex items-center space-x-1">
                        <Hash size={14} className="text-lime-400" />
                        <span className="font-black text-lg">{we.sets}</span>
                      </div>
                    </div>
                    <div className="text-center border-x-2 border-zinc-700 px-6">
                      <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Reps</p>
                      <div className="flex items-center space-x-1">
                        <PlayCircle size={14} className="text-lime-400" />
                        <span className="font-black text-lg">{we.reps}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Descanso</p>
                      <div className="flex items-center space-x-1">
                        <Clock size={14} className="text-lime-400" />
                        <span className="font-black text-lg">{we.rest_time}s</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden md:block">
                    <ChevronRight size={24} className="text-zinc-600 group-hover:text-lime-400 transition-colors" />
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-10">
              <Button 
                onClick={() => navigate('/dashboard')} 
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
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full">
              Voltar ao Início
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};
