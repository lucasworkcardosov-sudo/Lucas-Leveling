import React, { useState, useEffect } from 'react';
import { Profile, Workout } from '../types';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { LogOut, Dumbbell, Trophy, ShieldAlert, ShieldCheck, Scroll, Sword, CheckCircle2, Search, TrendingUp, LayoutList, X, Hash, PlayCircle, Clock, Scale, Info, AlertTriangle, RefreshCcw, Calendar, Camera, Image, ArrowUpRight, CheckSquare, Rocket } from 'lucide-react';
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
            isCompleted ? "bg-lime-400 border-black text-black scale-110 z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-white border-zinc-100 text-zinc-300",
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
    <div className="min-h-screen bg-zinc-100 font-pixel text-lg">
      <header className="border-b-[6px] border-black bg-white sticky top-0 z-50 px-4 py-2 md:py-4 flex justify-between items-center gap-2 md:gap-4 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] w-full">
        <div className="flex items-center space-x-2 shrink-0 min-w-0">
          <Dumbbell className="text-lime-500 shrink-0" strokeWidth={4} size={24} md:size={28} />
          <h1 className="font-black uppercase tracking-tighter italic font-press leading-none truncate flex items-center">
            <span className="text-[clamp(0.75rem,4vw,1.25rem)]">QUEST</span>
            <span className="text-lime-500 ml-1 text-[clamp(0.75rem,4vw,1.25rem)] hidden xs:inline">WORKOUT</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
          {profile.role === 'admin' && (
            <button 
              onClick={() => navigate('/admin')}
              className="hidden md:block text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-lime-500 border-4 border-black px-3 py-1 transition-all italic shrink-0 font-press bg-white shadow-[2px_2px_0px_0px_black]"
            >
              MESTRE
            </button>
          )}

          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="flex items-center gap-1.5 md:gap-2 mr-0.5 md:mr-1 shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-900 border-[3px] border-rpg-gold flex items-center justify-center relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden shrink-0 min-w-[32px]">
                <span className="text-[10px] md:text-xs font-black text-white font-press">{initials}</span>
              </div>
              <span className="hidden lg:block text-xs font-black uppercase tracking-widest text-zinc-600 truncate max-w-[100px] font-press text-[8px]">
                {displayName}
              </span>
            </div>

            <div className="flex items-center space-x-1 md:space-x-2 bg-black text-white px-2 md:px-4 py-1 md:py-1.5 border-[3px] border-rpg-gold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 min-w-[50px] md:min-w-[70px]">
              <Trophy size={12} className="text-rpg-gold font-bold md:size-14" />
              <span className="text-[9px] md:text-sm font-black uppercase tracking-wider font-press">L{profile.level}</span>
              <span className="hidden sm:inline text-[9px] text-zinc-400 font-bold font-press">{profile.xp} XP</span>
            </div>

            <button 
              onClick={handleLogout} 
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-zinc-400 hover:text-black border-2 border-transparent hover:border-black transition-all hover:bg-zinc-100 shrink-0"
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
             <div className="bg-white border-[6px] border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] pixel-card">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-[70px] h-[70px] min-w-[70px] bg-zinc-900 border-[5px] border-rpg-gold flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                      <span className="text-2xl font-black text-white italic font-press">{initials}</span>
                      <div className="absolute top-0 right-0 w-2 h-2 bg-rpg-gold"></div>
                   </div>
                   <div className="w-full overflow-hidden">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5 font-press">HERÓI</h3>
                      <h2 
                        className={cn(
                          "font-black uppercase tracking-tighter leading-none break-all font-press",
                          displayName.length > 20 ? "text-[10px]" : 
                          displayName.length > 15 ? "text-[12px]" : "text-[14px]"
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
                      <span>{selectedWorkout ? dailyProgress : 100}%</span>
                    </div>
                    <div className="pixel-bar-bg">
                      <div 
                        className="pixel-bar-fill bg-rpg-life" 
                        style={{ width: `${selectedWorkout ? dailyProgress : 100}%` }}
                      />
                    </div>
                  </div>

                  {/* MANA BAR (Level Progress) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest font-press">
                      <span className="text-rpg-mana">MANA (EXP)</span>
                      <span>{(profile.xp || 0) % 500 / 5}%</span>
                    </div>
                    <div className="pixel-bar-bg">
                      <div 
                        className="pixel-bar-fill bg-rpg-mana" 
                        style={{ width: `${(profile.xp || 0) % 500 / 5}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => navigate('/profile')} 
                    variant="outline" 
                    className="w-full text-[8px] h-10 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-press"
                  >
                    AJUSTES
                  </Button>
                  <Button 
                    onClick={() => setIsProgressOpen(true)} 
                    variant="secondary" 
                    className="w-full text-[8px] h-10 border-4 border-black shadow-[4px_4px_0px_0px_#FFD700] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] bg-white text-black font-press"
                  >
                    AVANÇO
                  </Button>
                </div>
             </div>

             <div className="bg-zinc-900 text-white border-[6px] border-black p-6 shadow-[10px_10px_0px_0px_#a3e635] relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 font-bold text-4xl rotate-12 pointer-events-none font-press">QUEST</div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-lime-400 mb-2 flex items-center font-press">
                  <ShieldAlert size={14} className="mr-2" /> COMANDO DO MESTRE
                </h3>
                <p className="text-lg font-bold leading-tight italic font-pixel">
                  {profile.goal === 'Hipertrofia' 
                    ? (profile.gender === 'Masculino' ? 'Sinta suas fibras musculares se expandindo como um titã.' : 'Construa a força de uma deusa guerreira.')
                    : profile.goal === 'Emagrecimento'
                    ? 'Queime a fraqueza e revele o herói que existe em você.'
                    : 'A jornada é longa, mas a glória de um herói é eterna.'}
                </p>
             </div>

             <div className="space-y-4">
                <div className="flex items-center space-x-2 px-2">
                   <LayoutList size={18} className="text-zinc-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic font-press">MAPA DE DUNGEONS</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                   {activeWorkouts.length > 0 ? (
                     activeWorkouts.map((workout) => (
                       <button 
                         key={workout.id}
                         onClick={() => setSelectedWorkout(workout)}
                         className={cn(
                           "relative w-full text-left p-5 border-[6px] border-black transition-all group overflow-hidden pixel-card",
                           selectedWorkout?.id === workout.id 
                             ? "bg-lime-400 shadow-none translate-x-[4px] translate-y-[4px]" 
                             : "bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
                         )}
                       >
                         {selectedWorkout?.id === workout.id && (
                           <div className="absolute top-0 right-0 w-8 h-8 bg-zinc-900 flex items-center justify-center">
                             <Trophy size={14} className="text-rpg-gold" />
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
             <div className="bg-white border-[6px] border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] pixel-card">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-black flex items-center font-press">
                     <Calendar size={14} className="mr-2" /> FREQUÊNCIA
                   </span>
                   <span className="text-[9px] font-black text-lime-600 bg-lime-50 px-2 py-0.5 border-2 border-black font-press">
                     {trainingHistory.length} DIAS
                   </span>
                </div>
                {renderCalendar()}
             </div>

             <div className="pt-4 space-y-3">
                <button 
                  onClick={() => navigate('/workout')}
                  className="w-full bg-white border-[6px] border-black p-3 flex items-center justify-between group hover:shadow-[4px_4px_0px_0px_rgba(163,230,53,1)] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-press"
                >
                   <span className="text-[10px] font-black uppercase tracking-tighter italic">BIBLIOTECA</span>
                   <Hash size={16} className="text-lime-500" />
                </button>

                <button 
                  onClick={() => navigate('/progress')}
                  className="w-full bg-white border-[6px] border-black p-3 flex items-center justify-between group hover:shadow-[4px_4px_0px_0px_rgba(163,230,53,1)] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-press"
                >
                   <span className="text-[10px] font-black uppercase tracking-tighter italic">REGISTROS</span>
                   <TrendingUp size={16} className="text-lime-500" />
                </button>
             </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
             {selectedWorkout ? (
               <div className="space-y-6">
                 <div className="bg-white border-4 border-black p-4 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-4 py-1 bg-black text-lime-400 font-black italic uppercase text-[10px] transform rotate-bg rotate-0">
                       {selectedWorkout.division || 'DUNGEON ATIVA'}
                    </div>
                    <h1 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter leading-tight mb-2">
                       {selectedWorkout.name}
                    </h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs flex items-center">
                       <Clock size={14} className="mr-2" /> {selectedWorkout.exercises?.length || 0} Exercícios Planejados
                    </p>
                 </div>

                 <div className="space-y-6">
                    {selectedWorkout.exercises?.map((we: any, idx: number) => (
                      <div key={idx} className={cn(
                        "bg-white border-[6px] border-black p-4 md:py-3 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 group transition-all pixel-card md:h-[135px]",
                        completedExercises.includes(idx) 
                          ? "bg-zinc-50 border-zinc-300 opacity-70 grayscale shadow-none translate-x-[4px] translate-y-[4px]" 
                          : "shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
                      )}>
                        <div className="flex items-center flex-1 min-w-0">
                          <button 
                            onClick={() => toggleExerciseCompletion(idx)}
                            className={cn(
                              "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border-4 border-black italic shrink-0 mr-4 md:mr-6 text-lg md:text-xl transition-all font-press",
                              completedExercises.includes(idx) ? "bg-black text-lime-400" : "bg-zinc-100 text-zinc-400 hover:border-rpg-gold"
                            )}
                          >
                            {completedExercises.includes(idx) ? <CheckCircle2 size={24} strokeWidth={4} /> : idx + 1}
                          </button>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-rpg-gold bg-black px-1.5 py-0.5 font-press">{we.category || 'QUEST'}</span>
                                {completedExercises.includes(idx) && (
                                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-lime-600 bg-lime-50 px-1.5 py-0.5 border-2 border-lime-500 font-press">OK</span>
                                )}
                             </div>
                            <h3 className={cn(
                              "font-black uppercase tracking-tighter transition-colors truncate font-press text-[14px] md:text-[16px]",
                              completedExercises.includes(idx) ? "text-zinc-400 line-through" : "group-hover:text-rpg-gold"
                            )}>
                              {we.name}
                            </h3>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 md:flex md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto shrink-0">
                          <div className="bg-zinc-50 p-2 md:p-2.5 border-4 border-black min-w-0 md:min-w-[70px] text-center shadow-[3px_3px_0px_0px_black] relative">
                             <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-black text-white text-[7px] font-black px-1.5 font-press uppercase">Sets</div>
                             <p className="text-base md:text-lg font-black italic font-pixel">{we.sets || '3'}</p>
                          </div>
                          <div className="bg-zinc-50 p-2 md:p-2.5 border-4 border-black min-w-0 md:min-w-[80px] text-center shadow-[3px_3px_0px_0px_black] relative">
                             <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-black text-white text-[7px] font-black px-1.5 font-press uppercase">Reps</div>
                             <p className="text-base md:text-lg font-black italic font-pixel">{we.reps || '12'}</p>
                          </div>
                          <div className="bg-zinc-50 p-2 md:p-2.5 border-4 border-black min-w-0 md:min-w-[75px] text-center shadow-[3px_3px_0px_0px_black] relative">
                             <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-rpg-gold text-black text-[7px] font-black px-1.5 font-press uppercase">Carga</div>
                             <p className="text-base md:text-lg font-black italic text-rpg-bronze font-pixel">{we.weight || '--'}</p>
                          </div>
                          
                          <div className="col-span-3 flex items-center space-x-2 mt-2 md:mt-0 md:flex-none">
                             <button 
                               onClick={() => handleOpenReplacement(idx, we.category || we.muscle_group)}
                               className="flex-1 md:flex-none p-2.5 md:p-3 bg-white text-black hover:bg-black hover:text-white transition-all border-4 border-black flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_black] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
                               title="Trocar Exercício"
                             >
                               <RefreshCcw size={16} strokeWidth={3} />
                               <span className="md:hidden text-[9px] font-black uppercase tracking-widest font-press">TROCAR</span>
                             </button>
                             <button 
                               onClick={() => setActiveVideo({ name: we.name, url: we.video_url || '', instructions: we.instructions || '' })}
                               className="flex-1 md:flex-none p-2.5 md:p-3 bg-black text-white hover:bg-rpg-gold hover:text-black transition-all border-4 border-black flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#CD7F32] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
                               title="Ver Demonstração"
                             >
                               <PlayCircle size={18} strokeWidth={3} />
                               <span className="md:hidden text-[9px] font-black uppercase tracking-widest font-press">VÍDEO</span>
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
                        "w-full py-6 md:py-10 px-8 text-white font-black uppercase italic text-[clamp(1.2rem,5vw,1.75rem)] tracking-tighter border-[8px] border-black transition-all shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] disabled:opacity-50 flex items-center justify-center text-center font-press pixel-card",
                        loading ? "bg-zinc-800" : "bg-[#a3e635] !text-black hover:bg-lime-500"
                      )}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                           <RefreshCcw className="animate-spin mr-6 shrink-0" size={32} strokeWidth={4} />
                           <span>SUBMETENDO...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center leading-tight">
                           <ShieldCheck size={40} className="mr-6 shrink-0" strokeWidth={4} />
                           <span className="block">CONCLUIR QUEST (+120 EXP)</span>
                        </div>
                      )}
                    </button>
                 </div>
               </div>
             ) : (
               <div className="bg-white border-[8px] border-black p-20 text-center border-dashed flex flex-col items-center justify-center min-h-[400px] pixel-card">
                  <div className="w-24 h-24 bg-zinc-900 border-4 border-rpg-gold flex items-center justify-center mb-8 rotate-45 shadow-[8px_8px_0px_0px_black]">
                    <Dumbbell size={48} className="text-rpg-gold -rotate-45" strokeWidth={3} />
                  </div>
                  <p className="text-zinc-600 font-black uppercase italic tracking-widest text-2xl font-press">
                    SELECIONE UMA DUNGEON <br /> <span className="text-sm text-zinc-400 mt-4 block">PARA COMEÇAR A SUA JORNADA</span>
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
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-lime-400/20 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-50 border-[10px] border-black w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-[30px_30px_0px_0px_rgba(0,0,0,1)] font-pixel"
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
                   <div className="bg-white border-[6px] border-black p-8 shadow-[12px_12px_0px_0px_#a3e635] pixel-card">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-press mb-2">EXPERIÊNCIA TOTAL</h3>
                          <p className="text-5xl font-black italic font-press">{profile.xp} XP</p>
                        </div>
                        <div className="bg-black text-rpg-gold px-4 py-2 font-black text-2xl italic border-4 border-black font-press">
                          LVL {profile.level}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between text-[10px] font-black uppercase font-press">
                           <span>PRÓXIMO NÍVEL</span>
                           <span>{profile.xp % 500} / 500</span>
                        </div>
                        <div className="pixel-bar-bg h-8">
                          <div 
                            className="pixel-bar-fill bg-rpg-mana h-full"
                            style={{ width: `${(profile.xp % 500) / 5}%` }}
                          />
                        </div>
                        <p className="text-xs font-bold text-zinc-400 uppercase font-pixel tracking-wider italic">
                           VOCÊ PRECISA DE MAIS {500 - (profile.xp % 500)} XP PARA TRANSCENDER.
                        </p>
                      </div>
                   </div>

                   {/* Daily Mission Card */}
                   <div className="bg-zinc-50 border-[6px] border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] pixel-card">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="bg-black p-2 border-2 border-rpg-gold">
                          <Sword className="text-rpg-gold" size={24} />
                        </div>
                        <h3 className="font-black uppercase tracking-widest text-sm italic font-press">MISSÃO ATIVA</h3>
                      </div>
                      
                      {selectedWorkout ? (
                        <div className="space-y-5">
                          <p className="text-2xl font-black uppercase italic leading-none font-press text-lg">{selectedWorkout.name}</p>
                          <div className="space-y-2">
                             <div className="flex justify-between text-[10px] font-black font-press">
                               <span>PROGRESSO</span>
                               <span>{dailyProgress}%</span>
                             </div>
                             <div className="pixel-bar-bg h-6">
                                <div 
                                  className="pixel-bar-fill bg-rpg-life h-full"
                                  style={{ width: `${dailyProgress}%` }}
                                />
                             </div>
                          </div>
                          <p className="text-xs font-bold text-zinc-500 uppercase font-pixel">
                             {completedExercises.length} DE {selectedWorkout.exercises?.length} SETS CONCLUÍDOS NESTA DUNGEON.
                          </p>
                        </div>
                      ) : (
                        <div className="py-10 text-center opacity-30">
                           <Dumbbell size={48} className="mx-auto mb-4" />
                           <p className="text-zinc-500 italic font-press text-[10px]">Nenhuma dungeon selecionada.</p>
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
                           <div key={photo.id} className="aspect-square bg-zinc-900 border-[6px] border-black relative group overflow-hidden pixel-card shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
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
                     <div className="py-20 text-center border-[6px] border-dashed border-zinc-300 bg-zinc-50 pixel-card">
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
                          className="w-full bg-white border-4 border-black p-4 text-left hover:bg-black hover:text-white group transition-all"
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
