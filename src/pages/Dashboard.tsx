import React, { useState, useEffect } from 'react';
import { Profile, Workout } from '../types';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { LogOut, Dumbbell, Trophy, ShieldAlert, CheckCircle2, Search, TrendingUp, LayoutList, X, Hash, PlayCircle, Clock, Scale, Info, AlertTriangle, RefreshCcw, Calendar, Camera, Image, ArrowUpRight, CheckSquare, Rocket } from 'lucide-react';
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
      alert('FOTO SALVA NA SUA GALERIA DE PROGRESSO!');
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
      alert('TREINO CONCLUÍDO! +100 XP ADICIONADOS AO SEU PERFIL!');
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
    <div className="min-h-screen bg-zinc-50 font-sans">
      <header className="border-b-4 border-black bg-white sticky top-0 z-10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Dumbbell className="text-lime-500" strokeWidth={3} />
          <span className="font-black uppercase tracking-tighter text-2xl italic">LEVELING.</span>
        </div>
        
          <div className="hidden md:flex items-center space-x-6">
             <div className="flex items-center space-x-3 mr-4">
                <div className="w-8 h-8 rounded-full bg-zinc-900 border-2 border-black flex items-center justify-center overflow-hidden">
                  <span className="text-[10px] font-black text-white">{initials}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 truncate max-w-[120px]">
                  {displayName}
                </span>
             </div>
             {profile.role === 'admin' && (
             <button 
               onClick={() => navigate('/admin')}
               className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-lime-500 border-2 border-zinc-100 hover:border-lime-500 px-3 py-1 transition-all italic"
             >
               PAINEL MESTRE
             </button>
           )}
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

      <main className="max-w-[1400px] mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Left */}
          <div className="space-y-6 lg:col-span-1">
             <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-[60px] h-[60px] min-w-[60px] rounded-full bg-zinc-900 border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-xl font-black text-white italic">{initials}</span>
                   </div>
                   <div className="w-full overflow-hidden">
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-0.5">Atleta</h3>
                      <h2 
                        className={cn(
                          "font-black uppercase tracking-tighter leading-none break-all",
                          displayName.length > 20 ? "text-base" : 
                          displayName.length > 15 ? "text-lg" : "text-xl"
                        )}
                        title={displayName}
                      >
                        {displayName}
                      </h2>
                   </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    {selectedWorkout ? (
                      <>
                        <span className="text-lime-600">Missão Diária</span>
                        <span>{dailyProgress}%</span>
                      </>
                    ) : (
                      <>
                        <span className="text-zinc-500">Nível {profile.level}</span>
                        <span>{profile.xp} XP</span>
                      </>
                    )}
                  </div>
                  <div className="h-3 w-full bg-zinc-100 border-2 border-black overflow-hidden relative">
                    <div 
                      className="h-full bg-lime-400 border-r-2 border-black transition-all duration-500" 
                      style={{ width: `${selectedWorkout ? dailyProgress : (profile.xp || 0) % 500 / 5}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => navigate('/profile')} 
                    variant="outline" 
                    className="w-full text-[10px] h-8 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    CONFIGURAÇÕES
                  </Button>
                  <Button 
                    onClick={() => setIsProgressOpen(true)} 
                    variant="secondary" 
                    className="w-full text-[10px] h-8 border-2 border-black shadow-[2px_2px_0px_0px_rgba(163,230,53,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] bg-lime-400 text-black hover:bg-lime-500"
                  >
                    PROGRESSO
                  </Button>
                </div>
             </div>

             <div className="bg-zinc-900 text-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(163,230,53,1)]">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-lime-400 mb-2 flex items-center">
                  <ShieldAlert size={14} className="mr-2" /> Destaque do Dia
                </h3>
                <p className="text-sm font-bold leading-tight italic">
                  Foco em <span className="text-lime-400">{profile.goal || 'Performance'}</span>. {profile.gender === 'Masculino' ? 'Bora pra cima!' : 'Vamos com tudo!'}
                </p>
             </div>

             <div className="space-y-3">
                <div className="flex items-center space-x-2 px-2">
                  <LayoutList size={16} className="text-zinc-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Seus Treinos Arrolados</span>
                </div>
                
                <div className="space-y-3">
                   {activeWorkouts.length > 0 ? (
                     activeWorkouts.map((workout) => (
                       <button 
                         key={workout.id}
                         onClick={() => setSelectedWorkout(workout)}
                         className={cn(
                           "w-full text-left p-4 border-4 border-black transition-all group overflow-hidden",
                           selectedWorkout?.id === workout.id 
                             ? "bg-lime-400 shadow-none translate-x-[2px] translate-y-[2px]" 
                             : "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                         )}
                       >
                         <div className="flex items-center space-x-4">
                           <div className={cn(
                             "min-w-[42px] h-10 flex items-center justify-center border-2 border-black font-black italic shrink-0 text-xs px-2",
                             selectedWorkout?.id === workout.id ? "bg-black text-lime-400" : "bg-zinc-100"
                           )}>
                             {workout.division || 'A'}
                           </div>
                           <div className="flex-1 min-w-0 overflow-hidden">
                             <h4 className="font-black uppercase tracking-tighter italic text-base truncate leading-tight">{workout.name}</h4>
                             <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                               {workout.exercises?.length || 0} Exercícios
                             </p>
                           </div>
                         </div>
                       </button>
                     ))
                   ) : (
                     <div className="p-4 border-2 border-black border-dashed text-center">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase italic">Vazio</p>
                     </div>
                   )}
                </div>
             </div>

             {/* Calendar Widget */}
             <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-black flex items-center">
                     <Calendar size={14} className="mr-2" /> Frequência
                   </span>
                   <span className="text-[9px] font-black text-lime-600 bg-lime-50 px-2 py-0.5 border border-lime-200">
                     {trainingHistory.length} DIAS ATIVOS
                   </span>
                </div>
                {renderCalendar()}
             </div>

             <div className="pt-4 space-y-3">
                <button 
                  onClick={() => navigate('/workout')}
                  className="w-full bg-white border-4 border-black p-3 flex items-center justify-between group hover:shadow-[4px_4px_0px_0px_rgba(163,230,53,1)] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                   <span className="text-xs font-black uppercase tracking-tighter italic">Biblioteca</span>
                   <Hash size={16} className="text-lime-500" />
                </button>

                <button 
                  onClick={() => navigate('/progress')}
                  className="w-full bg-white border-4 border-black p-3 flex items-center justify-between group hover:shadow-[4px_4px_0px_0px_rgba(163,230,53,1)] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                   <span className="text-xs font-black uppercase tracking-tighter italic">Progresso</span>
                   <TrendingUp size={16} className="text-lime-500" />
                </button>
             </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
             {selectedWorkout ? (
               <div className="space-y-6">
                 <div className="bg-white border-4 border-black p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-4 py-1 bg-black text-lime-400 font-black italic uppercase text-[10px] transform rotate-bg rotate-0">
                       {selectedWorkout.division || 'TREINO ATIVO'}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none mb-2">
                       {selectedWorkout.name}
                    </h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs flex items-center">
                       <Clock size={14} className="mr-2" /> {selectedWorkout.exercises?.length || 0} Exercícios Planejados
                    </p>
                 </div>

                 <div className="space-y-4">
                    {selectedWorkout.exercises?.map((we: any, idx: number) => (
                      <div key={idx} className={cn(
                        "bg-white border-4 border-black p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
                        completedExercises.includes(idx) && "bg-lime-50 border-lime-500 shadow-[8px_8px_0px_0px_rgba(163,230,53,1)]"
                      )}>
                        <div className="flex items-center flex-1">
                          <button 
                            onClick={() => toggleExerciseCompletion(idx)}
                            className={cn(
                              "w-12 h-12 flex items-center justify-center border-2 border-black italic shrink-0 mr-6 text-xl transition-all",
                              completedExercises.includes(idx) ? "bg-black text-lime-400" : "bg-zinc-100 text-zinc-400 hover:border-lime-500"
                            )}
                          >
                            {completedExercises.includes(idx) ? <CheckCircle2 size={24} strokeWidth={3} /> : idx + 1}
                          </button>
                          <div>
                            <h3 className={cn(
                              "font-black uppercase tracking-tighter text-2xl leading-none mb-1 transition-colors",
                              completedExercises.includes(idx) ? "text-zinc-400 line-through" : "group-hover:text-lime-600"
                            )}>
                              {we.name}
                            </h3>
                            <div className="flex items-center space-x-2">
                               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{we.category || 'Geral'}</span>
                               <div className="h-1 w-1 bg-zinc-300 rounded-full"></div>
                               <span className={cn(
                                 "text-[10px] font-black uppercase tracking-widest italic",
                                 completedExercises.includes(idx) ? "text-lime-600" : "text-zinc-300"
                               )}>
                                 {completedExercises.includes(idx) ? 'Concluído' : 'Pendente'}
                               </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="bg-zinc-50 p-3 border-2 border-black min-w-[80px] text-center">
                            <p className="text-[8px] font-black uppercase text-zinc-400 mb-1">Séries</p>
                            <p className="text-xl font-black italic">{we.sets || '3'}</p>
                          </div>
                          <div className="bg-zinc-50 p-3 border-2 border-black min-w-[90px] text-center">
                            <p className="text-[8px] font-black uppercase text-zinc-400 mb-1">Repetições</p>
                            <p className="text-xl font-black italic">{we.reps || '12'}</p>
                          </div>
                          <div className="bg-zinc-50 p-3 border-2 border-black min-w-[80px] text-center">
                            <p className="text-[8px] font-black uppercase text-zinc-400 mb-1">Carga</p>
                            <p className="text-xl font-black italic text-lime-600">{we.weight || '--'}</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                             <button 
                               onClick={() => handleOpenReplacement(idx, we.category || we.muscle_group)}
                               className="p-3 bg-white text-black hover:bg-black hover:text-white transition-all border-2 border-black"
                               title="Trocar Exercício"
                             >
                               <RefreshCcw size={20} />
                             </button>
                             <button 
                               onClick={() => setActiveVideo({ name: we.name, url: we.video_url || '', instructions: we.instructions || '' })}
                               className="p-3 bg-black text-white hover:bg-lime-500 hover:text-black transition-all border-2 border-black"
                               title="Ver Demonstração"
                             >
                               <PlayCircle size={24} />
                             </button>
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>

                 <div className="pt-10 pb-20">
                    <button 
                      onClick={handleFinishWorkout}
                      disabled={loading}
                      className={cn(
                        "w-full py-8 text-black font-black uppercase italic text-4xl tracking-tighter border-4 border-black transition-all shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] disabled:opacity-50 flex items-center justify-center",
                        loading ? "bg-zinc-200" : "bg-lime-400 hover:bg-lime-500"
                      )}
                    >
                      {loading ? (
                        <div className="flex items-center">
                           <Clock className="animate-spin mr-4" size={32} />
                           FINALIZANDO...
                        </div>
                      ) : (
                        <>
                          <CheckCircle2 size={40} className="mr-6" strokeWidth={3} />
                          FINALIZAR TREINO (+100 XP)
                        </>
                      )}
                    </button>
                 </div>
               </div>
             ) : (
               <div className="bg-white border-4 border-black p-20 text-center border-dashed flex flex-col items-center justify-center">
                  <Dumbbell size={64} className="text-zinc-200 mb-6" />
                  <p className="text-zinc-400 font-black uppercase italic tracking-widest text-2xl">
                    Selecione um treino na lateral <br /> para começar a sua jornada.
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
              className="bg-white border-8 border-black w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-[24px_24px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="bg-black text-white p-6 flex justify-between items-center border-b-8 border-black shrink-0">
                <div className="flex items-center gap-3">
                  <Rocket size={32} className="text-lime-400" />
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter">Diário de <span className="text-lime-400">Progresso</span></h3>
                </div>
                <button onClick={() => setIsProgressOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                  <X size={40} strokeWidth={3} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Motivation Section */}
                <div className="bg-zinc-950 text-white p-6 border-4 border-black border-l-[16px] border-l-lime-400 relative overflow-hidden">
                   <div className="absolute top-[-20%] right-[-5%] opacity-10 rotate-12">
                      <Trophy size={160} />
                   </div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-400 mb-2 italic">Status do Guerreiro</h4>
                   <p className="text-2xl font-black uppercase italic tracking-tight relative z-10">
                      "{getMotivationalPhrase()}"
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Level Card */}
                   <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(163,230,53,1)]">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Acumulado</h3>
                          <p className="text-4xl font-black italic">{profile.xp} XP</p>
                        </div>
                        <div className="bg-black text-lime-400 px-3 py-1 font-black text-xl italic border-2 border-black">
                          LVL {profile.level}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                           <span>Rumo ao Level {profile.level + 1}</span>
                           <span>{profile.xp % 500} / 500</span>
                        </div>
                        <div className="h-6 w-full bg-zinc-100 border-2 border-black overflow-hidden relative">
                          <div 
                            className="h-full bg-lime-400 border-r-2 border-black transition-all duration-1000"
                            style={{ width: `${(profile.xp % 500) / 5}%` }}
                          />
                        </div>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">
                           Faltam {500 - (profile.xp % 500)} pontos para transcender.
                        </p>
                      </div>
                   </div>

                   {/* Daily Mission Card */}
                   <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckSquare className="text-black" size={24} />
                        <h3 className="font-black uppercase tracking-widest text-xs italic">Missão do Dia</h3>
                      </div>
                      
                      {selectedWorkout ? (
                        <div className="space-y-4">
                          <p className="text-xl font-black uppercase italic leading-none">{selectedWorkout.name}</p>
                          <div className="flex items-center gap-3">
                             <div className="flex-1 h-3 bg-zinc-100 border-2 border-black rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-black transition-all duration-500"
                                  style={{ width: `${dailyProgress}%` }}
                                />
                             </div>
                             <span className="text-sm font-black italic">{dailyProgress}%</span>
                          </div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase">
                             {completedExercises.length} de {selectedWorkout.exercises?.length} sets concluídos
                          </p>
                        </div>
                      ) : (
                        <p className="text-zinc-400 italic font-medium">Nenhum treino selecionado hoje.</p>
                      )}
                   </div>
                </div>

                {/* Photo Gallery */}
                <div className="space-y-6">
                   <div className="flex justify-between items-center border-b-4 border-black pb-4">
                      <div className="flex items-center gap-3">
                         <Camera size={24} className="text-black" />
                         <h3 className="text-xl font-black uppercase italic tracking-tighter">Galeria de Provas</h3>
                      </div>
                      <label className="cursor-pointer bg-black text-white px-6 py-2 text-xs font-black uppercase italic hover:bg-lime-400 hover:text-black transition-all border-2 border-black flex items-center gap-2">
                        {isUploadingPhoto ? <RefreshCcw size={16} className="animate-spin" /> : <Camera size={16} />}
                        {isUploadingPhoto ? 'PROCESSANDO...' : 'REGISTRAR SHAPE'}
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
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {progressPhotos.map((photo) => (
                           <div key={photo.id} className="aspect-square bg-zinc-50 border-4 border-black relative group overflow-hidden">
                              <img 
                                src={photo.photo_url} 
                                alt="Progresso" 
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 pointer-events-none">
                                 <p className="text-[8px] text-white font-black uppercase">
                                    {new Date(photo.created_at).toLocaleDateString()}
                                 </p>
                              </div>
                           </div>
                        ))}
                     </div>
                   ) : (
                     <div className="py-20 text-center border-4 border-dashed border-zinc-200 bg-zinc-50">
                        <Image size={64} className="mx-auto text-zinc-200 mb-4" />
                        <p className="text-zinc-400 font-black uppercase italic tracking-widest text-sm">Sua jornada visual começa aqui</p>
                     </div>
                   )}
                </div>
              </div>

              <div className="p-6 bg-zinc-100 border-t-8 border-black flex justify-end">
                 <Button onClick={() => setIsProgressOpen(false)} variant="secondary" className="px-12 py-4 h-auto text-xl font-black uppercase italic">
                   FECHAR DIÁRIO
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
