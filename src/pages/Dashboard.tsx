import React, { useState, useEffect } from 'react';
import { Profile, Workout } from '../types';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { LogOut, Dumbbell, Trophy, Shield, ShieldAlert, ShieldCheck, Scroll, Sword, CheckCircle2, Search, TrendingUp, LayoutList, X, Hash, PlayCircle, Clock, Scale, Info, AlertTriangle, RefreshCcw, Calendar, Camera, Image, ArrowUpRight, CheckSquare, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, getYoutubeEmbedUrl } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  profile: Profile;
  onRefresh: () => Promise<void>;
}

export const Dashboard = ({ profile, onRefresh }: DashboardProps) => {
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeWorkouts, setActiveWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ name: string, url: string, instructions: string } | null>(null);
  const [replacingExercise, setReplacingExercise] = useState<{ index: number, muscle_group: string } | null>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [isSearchingAlternatives, setIsSearchingAlternatives] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [progressPhotos, setProgressPhotos] = useState<any[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const navigate = useNavigate();

  const [trainingHistory, setTrainingHistory] = useState<string[]>([]);

  useEffect(() => {
    if (profile.id) {
      fetchActiveWorkouts();
      fetchTrainingHistory();
      fetchProgressPhotos();
    }
  }, [profile.id]);

  const fetchProgressPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProgressPhotos(data);
      }
    } catch (error) {
      console.error('Error fetching progress photos:', error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
      const filePath = `progress/${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(filePath);

      // 3. Save to progress_logs table
      const { error: logError } = await supabase.from('progress_logs').insert([{
        student_id: profile.id,
        photo_url: publicUrl,
        type: 'photo_log',
        notes: 'Treino do dia'
      }]);

      if (logError) throw logError;

      fetchProgressPhotos();
      alert('PROVA REGISTRADA NO SEU DIÁRIO DE GLÓRIA!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao salvar foto. Verifique se o bucket "progress-photos" está configurado.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const getMotivationalPhrase = () => {
    const isFemale = profile.gender === 'Feminino';
    const goal = profile.goal || 'Geral';
    
    if (goal.includes('Hipertrofia')) {
      return isFemale ? "Construindo uma versão mais forte a cada treino!" : "Foco no volume, a evolução não para!";
    }
    if (goal.includes('Emagrecimento')) {
      return isFemale ? "Cada gota de suor é um passo rumo ao seu objetivo!" : "A disciplina de hoje é o resultado de amanhã!";
    }
    return isFemale ? "Sua única competição é quem você foi ontem!" : "Sem atalhos, apenas trabalho duro!";
  };

  useEffect(() => {
    setCompletedExercises([]);
  }, [selectedWorkout?.id]);

  const fetchTrainingHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('completed_at')
        .eq('user_id', profile.id);

      if (error) {
        // Fallback to workout_logs if training_sessions doesn't exist
        const { data: logData } = await supabase
          .from('workout_logs')
          .select('completed_at')
          .eq('student_id', profile.id);
        
        if (logData) {
          const dates = logData.map(log => new Date(log.completed_at).toISOString().split('T')[0]);
          setTrainingHistory([...new Set(dates)]);
        }
        return;
      }
      
      if (data) {
        const dates = data.map(session => new Date(session.completed_at).toISOString().split('T')[0]);
        setTrainingHistory([...new Set(dates)]);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchActiveWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setActiveWorkouts(data);
        // Automatically select the first workout if none is selected
        if (!selectedWorkout) {
          setSelectedWorkout(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching active workouts:', error);
    }
  };

  const handleLogout = () => supabase.auth.signOut();

  const displayName = profile.nickname || profile.full_name || profile.email;
  const initials = (profile.nickname || profile.full_name || profile.email || '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const [completedExercises, setCompletedExercises] = useState<number[]>([]);

  const dailyProgress = selectedWorkout?.exercises?.length 
    ? Math.round((completedExercises.length / selectedWorkout.exercises.length) * 100) 
    : 0;

  const toggleExerciseCompletion = async (index: number) => {
    const isFirstOfToday = trainingHistory.length === 0 || !trainingHistory.includes(new Date().toISOString().split('T')[0]);
    
    if (!completedExercises.includes(index)) {
      setCompletedExercises([...completedExercises, index]);
      
      // If it's the first exercise completion of the day, record it
      if (isFirstOfToday) {
        try {
          const sessionData = {
            student_id: profile.id,
            user_id: profile.id,
            workout_id: selectedWorkout?.id,
            xp_gained: 10, // Small XP for individual exercise
            completed_at: new Date().toISOString(),
            completed_date: new Date().toISOString().split('T')[0]
          };

          await supabase.from('training_sessions').insert([sessionData]);
          await supabase.from('workout_logs').insert([sessionData]);
          fetchTrainingHistory();
        } catch (error) {
          console.error('Error recording first exercise:', error);
        }
      }
    } else {
      setCompletedExercises(completedExercises.filter(i => i !== index));
    }
  };

  const handleFinishWorkout = async () => {
    if (!selectedWorkout) return;
    if (completedExercises.length === 0) {
      alert('Complete pelo menos um exercício antes de finalizar!');
      return;
    }
    setLoading(true);
    try {
      // 1. Calculate XP and Level
      const newXp = (profile.xp || 0) + 100;
      const newLevel = Math.floor(newXp / 500) + 1;

      // 2. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          xp: newXp, 
          level: newLevel,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // 3. Save to workout_logs/training_sessions
      const sessionData = {
        student_id: profile.id,
        user_id: profile.id, // For compatibility
        workout_id: selectedWorkout.id,
        xp_gained: 100,
        completed_at: new Date().toISOString(),
        completed_date: new Date().toISOString().split('T')[0]
      };

      const { error: logError } = await supabase
        .from('training_sessions')
        .insert([sessionData]);

      if (logError) {
        await supabase
          .from('workout_logs')
          .insert([sessionData]);
      }

      await onRefresh();
      fetchTrainingHistory();
      setCompletedExercises([]);
      alert('QUEST CONCLUÍDA! +120 EXP ADICIONADOS AO SEU PERFIL!');
    } catch (error) {
      console.error('Erro ao finalizar treino:', error);
      alert('Erro ao salvar progresso.');
    } finally {
      setLoading(false);
    }
  };

  const renderCalendar = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isCompleted = trainingHistory.includes(dateStr);
      const isToday = day === today.getDate();

      days.push(
        <div 
          key={day} 
          className={cn(
            "h-8 w-8 flex items-center justify-center text-[10px] font-black border-2 transition-all relative",
            isCompleted ? "bg-rpg-life border-black text-white scale-110 z-10 shadow-lg shadow-rpg-life/20" : "bg-zinc-800 border-zinc-700 text-zinc-600",
            isToday && !isCompleted && "border-black text-black"
          )}
        >
          {day}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1 mt-4">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={`${d}-${i}`} className="text-center text-[8px] font-black text-zinc-400 mb-1">{d}</div>
        ))}
        {days}
      </div>
    );
  };

  const handleOpenReplacement = async (index: number, muscleGroup: string) => {
    if (!selectedWorkout?.exercises) return;
    const currentExercise = selectedWorkout.exercises[index];
    
    setReplacingExercise({ index, muscle_group: muscleGroup });
    setIsSearchingAlternatives(true);
    try {
      // 1. Fetch Master's Variations first
      const { data: variations, error: varError } = await supabase
        .from('exercise_variations')
        .select(`
          variation_id,
          exercises:variation_id (*)
        `)
        .eq('exercise_id', currentExercise.exercise_id);

      if (varError) console.error("Error fetching variations:", varError);

      const masterSuggestions = variations?.map((v: any) => ({
        ...v.exercises,
        isMasterSuggestion: true
      })) || [];

      // 2. Fetch general alternatives from the same muscle group
      const { data: generalAlts, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('muscle_group', muscleGroup)
        .neq('id', currentExercise.exercise_id)
        .limit(10);
      
      if (error) throw error;

      // Filter out general alternatives that are already in master suggestions
      const filteredGeneral = (generalAlts || []).filter(
        gen => !masterSuggestions.some(suggestion => suggestion.id === gen.id)
      );

      setAlternatives([...masterSuggestions, ...filteredGeneral]);
    } catch (error) {
      console.error('Error fetching alternatives:', error);
    } finally {
      setIsSearchingAlternatives(false);
    }
  };

  const confirmReplacement = async (newExercise: any) => {
    if (!selectedWorkout || replacingExercise === null) return;

    try {
      const updatedExercises = [...(selectedWorkout.exercises || [])];
      updatedExercises[replacingExercise.index] = {
        ...updatedExercises[replacingExercise.index],
        id: newExercise.id,
        name: newExercise.name,
        video_url: newExercise.video_url,
        instructions: newExercise.instructions,
        category: newExercise.muscle_group
      };

      const { error } = await supabase
        .from('workouts')
        .update({ exercises: updatedExercises })
        .eq('id', selectedWorkout.id);

      if (error) throw error;

      setSelectedWorkout({ ...selectedWorkout, exercises: updatedExercises });
      setReplacingExercise(null);
      setAlternatives([]);
      fetchActiveWorkouts(); // Refresh list to keep in sync
    } catch (error) {
      alert('Erro ao substituir exercício.');
    }
  };

  const groupedWorkouts: { [key: string]: Workout[] } = activeWorkouts.reduce((acc: { [key: string]: Workout[] }, workout) => {
    const name = workout.name || 'Treino';
    if (!acc[name]) acc[name] = [];
    acc[name].push(workout);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-zinc-900 stone-bg font-pixel text-lg">
      <header className="border-b-[6px] border-black bg-[#1a1a1a] sticky top-0 z-50 px-4 py-2 md:py-4 flex justify-between items-center gap-2 md:gap-4 shadow-[0_4px_15px_rgba(0,0,0,0.8)] w-full">
        <div className="flex items-center space-x-2 shrink-0 min-w-0">
          <Dumbbell className="text-rpg-gold shrink-0 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" strokeWidth={4} size={24} md:size={28} />
          <h1 className="font-black uppercase tracking-tighter italic font-gothic leading-none truncate flex items-center drop-shadow-lg">
            <span className="text-[clamp(1rem,5vw,1.75rem)] text-white shadow-black text-shadow-lg">QUEST</span>
            <span className="text-rpg-gold ml-2 text-[clamp(1rem,5vw,1.75rem)] hidden xs:inline">WORKOUT</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
          {profile.role === 'admin' && (
            <button 
              onClick={() => navigate('/admin')}
              className="hidden md:block text-[8px] font-black uppercase tracking-widest text-rpg-gold hover:text-white border-4 border-zinc-700 rpg-slot px-3 py-1 transition-all italic shrink-0 font-press bg-zinc-900"
            >
              MESTRE
            </button>
          )}

          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="flex items-center gap-1.5 md:gap-2 mr-0.5 md:mr-1 shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 rpg-slot flex items-center justify-center relative overflow-hidden shrink-0 min-w-[32px]">
                <span className="text-[10px] md:text-xs font-black text-white font-press">{initials}</span>
              </div>
              <span className="hidden lg:block text-xs font-black uppercase tracking-widest text-zinc-400 truncate max-w-[100px] font-press text-[8px]">
                {displayName}
              </span>
            </div>

            <div className="flex items-center space-x-1 md:space-x-2 rpg-slot-active px-2 md:px-4 py-1 md:py-1.5 shrink-0 min-w-[50px] md:min-w-[70px]">
              <Trophy size={12} className="text-rpg-gold font-bold md:size-14" />
              <span className="text-[9px] md:text-sm font-black uppercase tracking-wider font-press text-white">L{profile.level}</span>
              <span className="hidden sm:inline text-[9px] text-zinc-500 font-bold font-press">{profile.xp} XP</span>
            </div>

            <button 
              onClick={handleLogout} 
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-zinc-500 hover:text-rpg-gold border-2 border-transparent transition-all hover:bg-zinc-800 shrink-0"
              title="Logout"
            >
              <LogOut size={18} strokeWidth={3} md:size-20 />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1400px] mx-auto px-4 md:px-10 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Left */}
          <div className="space-y-6 lg:col-span-1">
             <div className="rpg-panel p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-rpg-gold/5 rounded-full blur-3xl"></div>
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-[70px] h-[70px] min-w-[70px] rpg-slot-active flex items-center justify-center relative overflow-hidden">
                      <span className="text-2xl font-black text-white italic font-press">{initials}</span>
                      <div className="absolute top-0 right-0 w-2 h-2 bg-rpg-gold"></div>
                   </div>
                   <div className="w-full overflow-hidden">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5 font-press">HERÓI</h3>
                      <h2 
                        className={cn(
                          "font-black uppercase tracking-tighter leading-none break-all font-epic text-white",
                          displayName.length > 20 ? "text-[14px]" : 
                          displayName.length > 15 ? "text-[16px]" : "text-[18px]"
                        )}
                        title={displayName}
                      >
                        {displayName}
                      </h2>
                   </div>
                </div>

                <div className="space-y-4 mb-6">
                  {/* LIFE BAR (Daily Mission) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest font-press">
                      <span className="text-rpg-life">LIFE (HP)</span>
                      <span className="text-white">{selectedWorkout ? dailyProgress : 100}%</span>
                    </div>
                    <div className="pixel-bar-bg border-zinc-700">
                      <div 
                        className="pixel-bar-fill bg-rpg-life shadow-[0_0_10px_rgba(225,29,72,0.5)]" 
                        style={{ width: `${selectedWorkout ? dailyProgress : 100}%` }}
                      />
                    </div>
                  </div>

                  {/* MANA BAR (Level Progress) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest font-press">
                      <span className="text-rpg-mana">MANA (EXP)</span>
                      <span className="text-white">{(profile.xp || 0) % 500 / 5}%</span>
                    </div>
                    <div className="pixel-bar-bg border-zinc-700">
                      <div 
                        className="pixel-bar-fill bg-rpg-mana shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
                        style={{ width: `${(profile.xp || 0) % 500 / 5}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => navigate('/profile')} 
                    className="w-full text-[8px] h-10 rpg-metallic text-white hover:brightness-125 font-press transition-all"
                  >
                    AJUSTES
                  </button>
                  <button 
                    onClick={() => setIsProgressOpen(true)} 
                    className="w-full text-[8px] h-10 rpg-metallic bg-zinc-800 border-rpg-gold text-rpg-gold hover:brightness-125 font-press transition-all"
                  >
                    AVANÇO
                  </button>
                </div>
             </div>

             <div className="bg-zinc-900/80 backdrop-blur-sm text-white border-[6px] border-zinc-800 p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 font-bold text-4xl rotate-12 pointer-events-none font-gothic">QUEST</div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-rpg-gold mb-2 flex items-center font-press">
                  <ShieldAlert size={14} className="mr-2" /> COMANDO DO MESTRE
                </h3>
                <p className="text-xl font-bold leading-tight italic font-epic text-zinc-300">
                  {profile.goal === 'Hipertrofia' 
                    ? (profile.gender === 'Masculino' ? 'A jornada é longa e as sombras crescem, mas a fibra de um herói é forjada no fogo do esforço.' : 'Que a força das antigas rainhas guie sua espada e sua determinação.')
                    : profile.goal === 'Emagrecimento'
                    ? 'Cada gota de suor é uma chama que consome a escuridão e revela o ouro puro em seu espírito.'
                    : 'A jornada é longa, mas a glória de um herói é eterna e canta nas estrelas.'}
                </p>
             </div>

             <div className="space-y-4">
                <div className="flex items-center space-x-2 px-2">
                   <LayoutList size={18} className="text-zinc-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic font-press">O MAPA DAS PROVAÇÕES</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                   {activeWorkouts.length > 0 ? (
                     activeWorkouts.map((workout) => (
                       <button 
                         key={workout.id}
                         onClick={() => setSelectedWorkout(workout)}
                         className={cn(
                           "relative w-full text-left p-5 border-[4px] border-zinc-700 transition-all group overflow-hidden rpg-metallic shadow-xl",
                           selectedWorkout?.id === workout.id 
                             ? "border-rpg-gold brightness-125 shadow-[0_0_15px_rgba(255,215,0,0.3)] scale-[1.01] z-10" 
                             : "opacity-70 hover:opacity-100 hover:border-zinc-500"
                         )}
                       >
                         {selectedWorkout?.id === workout.id && (
                           <div className="absolute top-0 right-0 w-8 h-8 bg-rpg-gold flex items-center justify-center">
                             <Shield size={14} className="text-black" />
                           </div>
                         )}
                          <div className="flex items-start gap-4">
                           <div className={cn(
                             "min-w-[48px] h-12 flex items-center justify-center border-4 border-black font-black italic shrink-0 text-lg font-press",
                             selectedWorkout?.id === workout.id ? "bg-black text-lime-400" : "bg-zinc-100"
                           )}>
                             {workout.division || 'A'}
                           </div>
                            <div className="flex-1 flex flex-col items-start gap-1 min-w-0 py-1">
                               <h4 className="font-black uppercase tracking-tighter italic font-press text-sm leading-tight break-words w-full">{workout.name}</h4>
                             <p className="text-[10px] md:text-[0.85rem] font-bold uppercase tracking-widest text-zinc-400 font-pixel leading-tight">
                                {workout.exercises?.length || 0} EXERCÍCIOS · NÍVEL REQ. 01
                             </p>
                           </div>
                         </div>
                       </button>
                     ))
                   ) : (
                     <div className="p-8 border-4 border-black border-dashed text-center bg-zinc-50">
                        <p className="text-xs font-bold text-zinc-400 uppercase italic font-press opacity-50">Dungeon Vazia</p>
                     </div>
                   )}
                </div>
             </div>

             {/* Calendar Widget */}
             <div className="rpg-panel p-4 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-rpg-gold flex items-center font-press">
                     <Calendar size={14} className="mr-2" /> CRONOLOGIA
                   </span>
                   <span className="text-[9px] font-black text-white bg-rpg-mana px-2 py-0.5 border border-rpg-mana font-press shadow-[0_0_5px_rgba(37,99,235,0.5)]">
                     {trainingHistory.length} DIAS
                   </span>
                </div>
                {renderCalendar()}
             </div>

             <div className="pt-4 space-y-3">
                <button 
                  onClick={() => navigate('/workout')}
                  className="w-full rpg-metallic p-4 flex items-center justify-between group hover:brightness-125 transition-all text-white font-press border-zinc-700 shadow-xl"
                >
                   <span className="text-[10px] font-black uppercase tracking-tighter italic">LIVRO DE MAGIA</span>
                   <Hash size={16} className="text-rpg-mana group-hover:animate-pulse" />
                </button>

                <button 
                  onClick={() => navigate('/progress')}
                  className="w-full rpg-metallic p-4 flex items-center justify-between group hover:brightness-125 transition-all text-white font-press border-zinc-700 shadow-xl"
                >
                   <span className="text-[10px] font-black uppercase tracking-tighter italic">CATEDRAL DE CRISTAL</span>
                   <TrendingUp size={16} className="text-rpg-life group-hover:animate-pulse" />
                </button>
             </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
             {selectedWorkout ? (
               <div className="space-y-6">
                 <div className="rpg-panel p-6 md:p-10 relative overflow-hidden shadow-2xl border-rpg-gold/30">
                    <div className="absolute top-0 right-0 px-6 py-2 bg-rpg-gold text-black font-black italic uppercase text-[12px] font-press shadow-lg z-10">
                       {selectedWorkout.division || 'PROVA ATIVA'}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none mb-3 text-white font-epic drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                       {selectedWorkout.name}
                    </h1>
                      <div className="flex items-center gap-6 relative z-10">
                        <p className="text-rpg-gold font-bold uppercase tracking-widest text-[10px] flex items-center font-press bg-black/40 px-3 py-1.5 border border-rpg-gold/20 shadow-inner">
                           <Clock size={14} className="mr-2" /> {selectedWorkout.exercises?.length || 0} DESAFIOS
                        </p>
                      </div>
                 </div>

                 <div className="space-y-6">
                    {selectedWorkout.exercises?.map((we: any, idx: number) => (
                      <div key={idx} className={cn(
                        "rpg-metallic p-4 md:py-3 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 group transition-all md:h-[135px] border-zinc-800 shadow-xl",
                        completedExercises.includes(idx) 
                          ? "opacity-40 grayscale shadow-none translate-x-[2px] translate-y-[2px] border-zinc-700 brightness-50" 
                          : "hover:border-rpg-mana/50 hover:shadow-[0_0_20px_rgba(37,99,235,0.1)] hover:brightness-110"
                      )}>
                        <div className="flex items-center flex-1 min-w-0">
                           <button 
                            onClick={() => toggleExerciseCompletion(idx)}
                            className={cn(
                              "w-12 h-12 md:w-16 md:h-16 flex items-center justify-center border-[4px] border-black italic shrink-0 mr-4 md:mr-8 text-xl md:text-2xl transition-all font-press relative overflow-hidden shadow-2xl",
                              completedExercises.includes(idx) 
                                ? "bg-black text-rpg-mana shadow-inner" 
                                : "bg-zinc-800 text-zinc-500 hover:border-rpg-mana hover:text-white group-hover:scale-105"
                            )}
                          >
                             {completedExercises.includes(idx) ? (
                               <ShieldCheck size={32} className="text-rpg-mana animate-bounce" strokeWidth={3} />
                             ) : (
                               <span className="relative z-10 text-shadow-sm">{idx + 1}</span>
                             )}
                             <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                          </button>
                          
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-rpg-mana bg-rpg-mana/10 px-2 py-0.5 font-press border border-rpg-mana/30 rounded-sm">PROVAÇÃO {idx + 1}</span>
                                {completedExercises.includes(idx) && (
                                  <span className="text-[9px] font-black uppercase tracking-widest text-white bg-rpg-mana px-2 py-0.5 border border-white/20 font-press animate-pulse">VENCIDO</span>
                                )}
                             </div>
                            <h3 className={cn(
                              "font-black uppercase tracking-tighter transition-colors truncate font-epic text-[20px] md:text-[26px] leading-tight",
                              completedExercises.includes(idx) ? "text-zinc-500 line-through" : "text-white group-hover:text-rpg-gold text-shadow-md"
                            )}>
                              {we.name}
                            </h3>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 md:flex md:flex-row items-center gap-3 md:gap-6 w-full md:w-auto shrink-0">
                          <div className="rpg-slot-active p-3 md:p-4 border-2 border-zinc-700 min-w-0 md:min-w-[85px] text-center shadow-xl relative overflow-hidden group/slot">
                             <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-zinc-600 text-zinc-500 text-[8px] font-black px-2 py-0.5 font-press uppercase z-20">Sets</div>
                             <p className="text-xl md:text-2xl font-black italic font-pixel text-white relative z-10">{we.sets || '3'}</p>
                             <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/slot:opacity-100 transition-opacity"></div>
                          </div>
                          
                          <div className="rpg-slot-active p-3 md:p-4 border-2 border-zinc-700 min-w-0 md:min-w-[95px] text-center shadow-xl relative overflow-hidden group/slot">
                             <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-zinc-600 text-zinc-500 text-[8px] font-black px-2 py-0.5 font-press uppercase z-20">Reps</div>
                             <p className="text-xl md:text-2xl font-black italic font-pixel text-white relative z-10">{we.reps || '12'}</p>
                             <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/slot:opacity-100 transition-opacity"></div>
                          </div>
                          
                          <div className="rpg-slot-active p-3 md:p-4 border-2 border-rpg-gold/40 min-w-0 md:min-w-[90px] text-center shadow-[0_0_15px_rgba(255,215,0,0.1)] relative overflow-hidden group/slot">
                             <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-rpg-gold/30 text-rpg-gold text-[8px] font-black px-2 py-0.5 font-press uppercase z-20">Carga</div>
                             <p className="text-xl md:text-2xl font-black italic text-rpg-gold font-pixel relative z-10">{we.weight || '--'}</p>
                             <div className="absolute inset-x-0 bottom-0 h-1 bg-rpg-gold/20"></div>
                             <div className="absolute inset-0 bg-rpg-gold/5 opacity-0 group-hover/slot:opacity-100 transition-opacity"></div>
                          </div>
                          
                          <div className="col-span-3 flex items-center space-x-2 mt-2 md:mt-0 md:flex-none">
                             <button 
                               onClick={() => handleOpenReplacement(idx, we.category || we.muscle_group)}
                               className="flex-1 md:flex-none w-12 h-12 md:w-14 md:h-14 rpg-metallic bg-zinc-800 text-zinc-400 hover:text-white border-zinc-700 flex items-center justify-center transition-all shadow-xl hover:brightness-125 group"
                               title="Trocar Exercício"
                             >
                               <RefreshCcw size={20} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-500" />
                             </button>
                             <button 
                               onClick={() => setActiveVideo({ name: we.name, url: we.video_url || '', instructions: we.instructions || '' })}
                               className="flex-1 md:flex-none w-12 h-12 md:w-14 md:h-14 rpg-metallic bg-zinc-800 text-rpg-mana hover:text-white border-zinc-700 flex items-center justify-center transition-all shadow-xl hover:brightness-125 group"
                               title="Ver Demonstração"
                             >
                               <PlayCircle size={22} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                             </button>
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>

                  <div className="pt-10 pb-20 max-w-full overflow-hidden">
                    <button 
                      onClick={handleFinishWorkout}
                      disabled={loading}
                      className={cn(
                        "w-full py-8 md:py-12 px-10 text-black font-black uppercase italic text-[clamp(1.2rem,6vw,2.2rem)] tracking-tighter border-[8px] border-zinc-900 transition-all shadow-[0_15px_40px_rgba(0,0,0,0.6)] hover:brightness-125 active:translate-y-2 disabled:opacity-50 overflow-hidden relative font-press group rpg-metallic",
                        loading ? "bg-zinc-800" : "bg-rpg-gold !text-black"
                      )}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                           <RefreshCcw className="animate-spin mr-6 shrink-0" size={32} strokeWidth={4} />
                           <span>SUBMETENDO...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col md:flex-row items-center justify-center leading-none relative z-10 gap-4 md:gap-8">
                           <div className="flex items-center gap-4">
                             <ShieldCheck size={50} className="text-black group-hover:scale-110 transition-transform" strokeWidth={4} />
                             <span className="block drop-shadow-md">REIVINDICAR VITÓRIA</span>
                           </div>
                           <div className="bg-black/10 px-4 py-2 border-2 border-black/20 rounded-lg text-[14px] md:text-[20px] shadow-inner font-press">
                              +120 EXP
                           </div>
                        </div>
                      )}
                    </button>
                 </div>
               </div>
             ) : (
               <div className="bg-[#1a1a1a] border-[8px] border-zinc-800 p-20 text-center border-dashed flex flex-col items-center justify-center min-h-[400px] shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 stone-bg opacity-10"></div>
                  <div className="w-24 h-24 bg-zinc-900 border-4 border-rpg-gold flex items-center justify-center mb-8 rotate-45 shadow-2xl group-hover:scale-110 transition-transform duration-500 relative z-10">
                    <Dumbbell size={48} className="text-rpg-gold -rotate-45" strokeWidth={3} />
                  </div>
                  <p className="text-white font-black uppercase italic tracking-widest text-3xl font-epic relative z-10 drop-shadow-lg">
                    SELECIONE UMA PROVAÇÃO <br /> <span className="text-lg text-rpg-gold mt-4 block font-press opacity-80">PARA INICIAR A SUA JORNADA</span>
                  </p>
               </div>
             )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isProgressOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#121212] border-[10px] border-zinc-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              <div className="bg-black text-white p-6 flex justify-between items-center border-b-[8px] border-black shrink-0">
                <div className="flex items-center gap-4">
                  <Scroll size={32} className="text-rpg-gold" />
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter font-press">DIÁRIO DO <span className="text-rpg-gold">HERÓI</span></h3>
                </div>
                <button onClick={() => setIsProgressOpen(false)} className="text-zinc-400 hover:text-rpg-gold transition-colors">
                  <X size={32} strokeWidth={4} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12">
                {/* Motivation Section */}
                <div className="bg-zinc-900 text-white p-8 border-[6px] border-black border-l-[20px] border-l-[#a3e635] relative overflow-hidden">
                   <div className="absolute top-[-20%] right-[-5%] opacity-10 rotate-12">
                      <Trophy size={160} />
                   </div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a3e635] mb-4 italic font-press">MENSAGEM DO MESTRE</h4>
                   <p className="text-2xl md:text-3xl font-black uppercase italic tracking-tight relative z-10 leading-tight">
                      "{getMotivationalPhrase()}"
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {/* Level Card */}
                   <div className="rpg-panel p-8 shadow-2xl relative overflow-hidden group/lvl">
                      <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-press mb-2">EXPERIÊNCIA TOTAL</h3>
                          <p className="text-5xl font-black italic font-press text-white drop-shadow-lg">{profile.xp} XP</p>
                        </div>
                        <div className="rpg-metallic bg-zinc-800 text-rpg-gold px-5 py-3 font-black text-3xl italic border-zinc-700 font-press shadow-2xl">
                          LVL {profile.level}
                        </div>
                      </div>
                      
                      <div className="space-y-6 relative z-10">
                        <div className="flex justify-between text-[11px] font-black uppercase font-press text-zinc-400">
                           <span>PRÓXIMO NÍVEL</span>
                           <span className="text-rpg-mana">{profile.xp % 500} / 500</span>
                        </div>
                        <div className="pixel-bar-bg h-10 border-4 border-black group-hover/lvl:brightness-125 transition-all">
                          <div 
                            className="pixel-bar-fill bg-rpg-mana h-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                            style={{ width: `${(profile.xp % 500) / 5}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase font-press tracking-wider italic leading-relaxed">
                           VOCÊ PRECISA DE MAIS <span className="text-white">{500 - (profile.xp % 500)} XP</span> PARA TRANSCENDER PARA A PRÓXIMA DIMENSÃO.
                        </p>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
                   </div>

                   {/* Daily Mission Card */}
                   <div className="rpg-metallic p-8 shadow-2xl border-zinc-800 relative bg-zinc-900 group/mission hover:brightness-110 transition-all">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="bg-black p-3 border-2 border-rpg-gold shadow-lg shadow-rpg-gold/10">
                          <Sword className="text-rpg-gold animate-pulse" size={28} />
                        </div>
                        <h3 className="font-black uppercase tracking-[0.2em] text-xs italic font-press text-rpg-gold">MISSÃO ATIVA</h3>
                      </div>
                      
                      {selectedWorkout ? (
                        <div className="space-y-6">
                          <p className="text-3xl font-black uppercase italic leading-tight font-epic text-white tracking-widest">{selectedWorkout.name}</p>
                          <div className="space-y-3">
                             <div className="flex justify-between text-[11px] font-black font-press text-zinc-500 uppercase tracking-tighter">
                               <span>PROGRESSO DA JORNADA</span>
                               <span className="text-rpg-life">{dailyProgress}%</span>
                             </div>
                             <div className="pixel-bar-bg h-8 border-2 border-black">
                                <div 
                                  className="pixel-bar-fill bg-rpg-life h-full shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                  style={{ width: `${dailyProgress}%` }}
                                />
                             </div>
                          </div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase font-press leading-relaxed">
                             <span className="text-white">{completedExercises.length} DE {selectedWorkout.exercises?.length}</span> PROVAÇÕES CONCLUÍDAS NESTA DUNGEON.
                          </p>
                        </div>
                      ) : (
                        <div className="py-12 text-center opacity-20 border-2 border-dashed border-zinc-700">
                           <Dumbbell size={48} className="mx-auto mb-4 text-zinc-500" />
                           <p className="text-zinc-500 italic font-press text-[10px] uppercase tracking-widest">Nenhuma dungeon selecionada.</p>
                        </div>
                      )}
                   </div>
                </div>

                {/* Photo Gallery */}
                <div className="space-y-8">
                   <div className="flex justify-between items-center border-b-6 border-black pb-6">
                      <div className="flex items-center gap-4">
                         <Camera size={32} className="text-black" />
                         <h3 className="text-3xl font-black uppercase italic tracking-tighter font-press">RETRATOS DE GLÓRIA</h3>
                      </div>
                      <label className="cursor-pointer bg-black text-white px-8 py-3 text-sm font-black uppercase italic hover:bg-rpg-gold hover:text-black transition-all border-[6px] border-black flex items-center gap-3 shadow-[6px_6px_0px_0px_#CD7F32] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] font-press">
                        {isUploadingPhoto ? <RefreshCcw size={20} className="animate-spin" /> : <Camera size={20} />}
                        {isUploadingPhoto ? 'PROCESSANDO...' : 'REGISTRAR'}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handlePhotoUpload} 
                          disabled={isUploadingPhoto}
                        />
                      </label>
                   </div>

                   {progressPhotos.length > 0 ? (
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                        {progressPhotos.map((photo) => (
                           <div key={photo.id} className="aspect-square bg-zinc-900 border-[6px] border-zinc-800 relative group overflow-hidden shadow-2xl rpg-metallic">
                              <img 
                                src={photo.photo_url} 
                                alt="Progresso" 
                                className="w-full h-full object-cover transition-transform group-hover:scale-110 image-rendering-pixelated"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 pointer-events-none">
                                 <p className="text-[10px] text-white font-black uppercase font-press">
                                    {new Date(photo.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                 </p>
                              </div>
                           </div>
                        ))}
                     </div>
                   ) : (
                     <div className="py-20 text-center border-[6px] border-dashed border-zinc-800 bg-zinc-900/50 rounded-xl">
                        <Image size={80} className="mx-auto text-zinc-200 mb-6 opacity-50" />
                        <p className="text-zinc-400 font-black uppercase italic tracking-widest text-lg font-press opacity-50">Galeria de Provas Vazia</p>
                     </div>
                   )}
                </div>
              </div>

              <div className="p-8 bg-zinc-100 border-t-[8px] border-black flex justify-end">
                 <Button onClick={() => setIsProgressOpen(false)} className="px-12 py-5 h-auto text-2xl font-press !border-[6px] border-black shadow-[8px_8px_0px_0px_black]">
                   [ SAIR ]
                 </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {replacingExercise !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-100 border-4 border-black w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-[16px_16px_0px_0px_rgba(163,230,53,1)]"
            >
              <div className="bg-black text-white p-6 flex justify-between items-center border-b-4 border-black shrink-0">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Escolha uma <span className="text-lime-400">Alternativa</span></h3>
                <button onClick={() => setReplacingExercise(null)} className="text-zinc-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {isSearchingAlternatives ? (
                  <div className="flex-1 flex items-center justify-center py-20">
                    <RefreshCcw className="animate-spin text-lime-500" size={40} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alternatives.length > 0 ? (
                      alternatives.map((alt) => (
                        <button
                          key={alt.id}
                          onClick={() => confirmReplacement(alt)}
                          className="w-full bg-zinc-900 border-4 border-zinc-800 p-5 text-left hover:border-rpg-mana hover:bg-black group transition-all rpg-panel"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-black uppercase tracking-tighter text-lg leading-tight group-hover:text-lime-400">{alt.name}</h4>
                                {alt.isMasterSuggestion && (
                                  <span className="text-[7px] font-black bg-lime-400 text-black px-1.5 py-0.5 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase italic">
                                    Sugestão do Mestre
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">{alt.muscle_group || alt.category}</p>
                            </div>
                            <div className="text-lime-500 group-hover:text-white">
                              <Dumbbell size={18} />
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <p className="font-bold text-zinc-400 italic">Nenhum exercício alternativo encontrado.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border-[10px] border-zinc-800 w-full max-w-3xl overflow-hidden shadow-2xl relative rpg-panel"
            >
              <div className="bg-black text-white p-6 border-b-4 border-black flex justify-between items-center">
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                   Demonstração: <span className="text-lime-400">{activeVideo.name}</span>
                 </h2>
                 <button onClick={() => setActiveVideo(null)} className="hover:text-lime-400 transition-colors">
                    <X size={32} strokeWidth={3} />
                 </button>
              </div>
              
              <div className="p-1 w-full overflow-hidden">
                 {(() => {
                   const embedUrl = getYoutubeEmbedUrl(activeVideo.url);
                   if (embedUrl) {
                     return (
                       <div className="aspect-video bg-zinc-900 border-4 border-black w-full overflow-hidden">
                         <iframe 
                           src={embedUrl}
                           className="w-full h-full object-cover"
                           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                           allowFullScreen
                         />
                       </div>
                     );
                   }
                   return (
                     <div className="aspect-video bg-zinc-100 flex flex-col items-center justify-center text-black p-6 md:p-10 text-center border-4 border-black w-full">
                        <AlertTriangle size={48} className="mb-4 text-lime-500" strokeWidth={3} />
                        <p className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter leading-tight">
                          VÍDEO INDISPONÍVEL <span className="text-zinc-400 block text-lg md:text-xl mt-2 font-black italic">PARA ESTE EXERCÍCIO</span>
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

              <div className="p-6 bg-[#1a1a1a] border-t-8 border-black flex justify-end">
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
