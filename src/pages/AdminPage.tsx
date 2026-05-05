import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Profile } from '../types';
import { LogOut, Users, UserPlus, ShieldCheck, Dumbbell, TrendingUp, LayoutList, X, Scale, Ruler, Brain, Mail, User, Zap, Activity, Plus, Save, Trash2, ListChecks, Clock, Calendar, BookOpen, Video, Info, Pencil, AlertTriangle, RefreshCcw, Play, Edit, Image as ImageIcon, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { getDynamicAvatar } from '../lib/avatarLibrary';

interface ExerciseBank {
  id: string;
  name: string;
  category: string;
  instructions: string;
  video_url: string;
}

export const AdminPage = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalHistory, setTotalHistory] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  
  // Workout Builder States
  const [isBuildingWorkout, setIsBuildingWorkout] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDivision, setWorkoutDivision] = useState('Treino A');
  const [workoutSets, setWorkoutSets] = useState('3');
  const [workoutReps, setWorkoutReps] = useState('10-12');
  const [workoutWeight, setWorkoutWeight] = useState('');
  const [availableExercises, setAvailableExercises] = useState<ExerciseBank[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<{ 
    id: string, 
    name: string, 
    category: string, 
    instructions: string, 
    video_url: string,
    sets: string,
    reps: string,
    weight: string
  }[]>([]);
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);

  // View Workouts States
  const [isViewingWorkouts, setIsViewingWorkouts] = useState(false);
  const [studentWorkouts, setStudentWorkouts] = useState<any[]>([]);
  const [isDeletingWorkout, setIsDeletingWorkout] = useState<string | null>(null);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);

  // Exercise Library States
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    muscle_group: '',
    instructions: '',
    video_url: ''
  });
  const [isSavingExercise, setIsSavingExercise] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [currentVariations, setCurrentVariations] = useState<string[]>([]);
  const [isAddingVariation, setIsAddingVariation] = useState(false);
  
  // Quick Variation States
  const [isCreatingQuickVariation, setIsCreatingQuickVariation] = useState(false);
  const [quickVariationName, setQuickVariationName] = useState('');
  const [quickVariationVideoUrl, setQuickVariationVideoUrl] = useState('');
  const [isSavingQuickVariation, setIsSavingQuickVariation] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Force clean data on every mount to avoid stale data
    fetchData(false);
    fetchExercises();
  }, [navigate]); // navigate dependency to ensure refresh if we come back from other pages

  const fetchExercises = async () => {
    const { data } = await supabase.from('exercises').select('*').order('name');
    if (data) {
      const formattedExercises = data.map((ex: any) => ({
        id: ex.id,
        name: ex.name,
        category: ex.muscle_group,
        instructions: ex.instructions,
        video_url: ex.video_url
      }));
      setAvailableExercises(formattedExercises);
    }
  };

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      console.log('[Admin] Fetching fresh data, bypassing cache...');
      // Use cache-busting header to ensure we don't get stale data
      const profilesRes = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'aluno') 
        .setHeader('Cache-Control', 'no-cache')
        .setHeader('Pragma', 'no-cache')
        .order('created_at', { ascending: false });
      
      const workoutsRes = await supabase.from('workouts').select('id', { count: 'exact' }).setHeader('Cache-Control', 'no-cache');
      const historyRes = await supabase.from('workout_history').select('id', { count: 'exact' }).setHeader('Cache-Control', 'no-cache');

      if (profilesRes.data) {
        setStudents(profilesRes.data);
      }
      
      if (workoutsRes.count !== null) setTotalWorkouts(workoutsRes.count);
      if (historyRes.count !== null) setTotalHistory(historyRes.count);
      else setTotalHistory(0);

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleLogout = () => supabase.auth.signOut();

  const calculateIMC = (weight?: number, height?: number) => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    const imc = weight / (heightInMeters * heightInMeters);
    return imc.toFixed(1);
  };

  const getIMCStatus = (imc: number) => {
    if (imc < 18.5) return { label: 'Abaixo do Peso', color: 'text-blue-500' };
    if (imc < 25) return { label: 'Normal', color: 'text-lime-500' };
    if (imc < 30) return { label: 'Sobrepeso', color: 'text-yellow-500' };
    return { label: 'Obesidade', color: 'text-red-500' };
  };

  const handleAddExercise = (exerciseId: string) => {
    const exercise = availableExercises.find(e => e.id === exerciseId);
    if (exercise && !selectedExercises.find(e => e.id === exerciseId)) {
      setSelectedExercises([...selectedExercises, { 
        id: exercise.id, 
        name: exercise.name,
        category: exercise.category,
        instructions: exercise.instructions,
        video_url: exercise.video_url,
        sets: workoutSets || '3',
        reps: workoutReps || '10-12',
        weight: workoutWeight || ''
      }]);
    }
  };

  const handleSaveWorkout = async () => {
    if (!selectedStudent || !workoutTitle || selectedExercises.length === 0) return;
    
    setIsSavingWorkout(true);
    try {
      const workoutData = {
        student_id: selectedStudent.id,
        name: workoutTitle,
        division: workoutDivision,
        sets: workoutSets || '3',
        reps: workoutReps || '10-12',
        weight: workoutWeight || '',
        exercises: selectedExercises.map((ex: any, index) => ({
          exercise_id: ex.id,
          name: ex.name,
          muscle_group: ex.category,
          instructions: ex.instructions,
          video_url: ex.video_url,
          sets: ex.sets || '3',
          reps: ex.reps || '10-12',
          weight: ex.weight || '',
          rest_time: 60,
          order_index: index
        }))
      };

      if (editingWorkoutId) {
        const { error: workoutError } = await supabase
          .from('workouts')
          .update(workoutData)
          .eq('id', editingWorkoutId);
        
        if (workoutError) throw workoutError;
        alert('Treino atualizado com sucesso!');
      } else {
        const { error: workoutError } = await supabase
          .from('workouts')
          .insert([workoutData]);
        
        if (workoutError) throw workoutError;
        alert('Treino montado com sucesso!');
      }

      setIsBuildingWorkout(false);
      setEditingWorkoutId(null);
      setWorkoutTitle('');
      setWorkoutSets('3');
      setWorkoutReps('10-12');
      setWorkoutWeight('');
      setSelectedExercises([]);
      fetchData();
      if (isViewingWorkouts) fetchStudentWorkouts(selectedStudent.id);
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Erro ao salvar treino.');
    } finally {
      setIsSavingWorkout(false);
    }
  };

  const fetchStudentWorkouts = async (studentId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudentWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching student workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    setIsDeletingWorkout(workoutId);
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);

      if (error) throw error;
      
      setStudentWorkouts(studentWorkouts.filter(w => w.id !== workoutId));
      fetchData(); // Refresh totals
      setWorkoutToDelete(null);
    } catch (error) {
      console.error('Error deleting workout:', error);
      alert('Erro ao excluir treino.');
    } finally {
      setIsDeletingWorkout(null);
    }
  };

  const handleEditWorkout = (workout: any) => {
    setEditingWorkoutId(workout.id);
    setWorkoutTitle(workout.name || '');
    setWorkoutDivision(workout.division || 'Treino A');
    setWorkoutSets(workout.sets || '3');
    setWorkoutReps(workout.reps || '10-12');
    setWorkoutWeight(workout.weight || '');
    
    const formattedExercises = (workout.exercises || []).map((ex: any) => ({
      id: ex.exercise_id,
      name: ex.name,
      category: ex.muscle_group,
      instructions: ex.instructions,
      video_url: ex.video_url,
      sets: ex.sets || '3',
      reps: ex.reps || '10-12',
      weight: ex.weight || ''
    }));
    
    setSelectedExercises(formattedExercises);
    setIsViewingWorkouts(false);
    setIsBuildingWorkout(true);
  };

  const handleSaveExercise = async () => {
    if (!newExercise.name || !newExercise.muscle_group) return;

    setIsSavingExercise(true);
    try {
      if (editingExerciseId) {
        // UPDATE existing exercise
        const { error } = await supabase
          .from('exercises')
          .update(newExercise)
          .eq('id', editingExerciseId);

        if (error) throw error;

        // Update variations
        await supabase.from('exercise_variations').delete().eq('exercise_id', editingExerciseId);
        if (currentVariations.length > 0) {
          const variationsData = currentVariations.map(vId => ({
            exercise_id: editingExerciseId,
            variation_id: vId
          }));
          await supabase.from('exercise_variations').insert(variationsData);
        }

        alert('Exercício atualizado com sucesso!');
      } else {
        // INSERT new exercise
        const { data, error } = await supabase
          .from('exercises')
          .insert([newExercise])
          .select();

        if (error) throw error;

        if (data && data[0] && currentVariations.length > 0) {
          const variationsData = currentVariations.map(vId => ({
            exercise_id: data[0].id,
            variation_id: vId
          }));
          await supabase.from('exercise_variations').insert(variationsData);
        }

        alert('Exercício cadastrado com sucesso!');
      }

      setNewExercise({ name: '', muscle_group: '', instructions: '', video_url: '' });
      setEditingExerciseId(null);
      setCurrentVariations([]);
      setIsAddingExercise(false);
      setIsLibraryOpen(false); // Close modal automatically
      fetchExercises();
    } catch (error) {
      console.error('Error saving exercise:', error);
      alert('Erro ao salvar exercício. Verifique as permissões de banco.');
    } finally {
      setIsSavingExercise(false);
    }
  };

  const handleCreateQuickVariation = async () => {
    if (!quickVariationName) {
      alert('Por favor, informe o nome do exercício.');
      return;
    }

    setIsSavingQuickVariation(true);
    try {
      // 1. Create the exercise
      const { data: newEx, error: exError } = await supabase
        .from('exercises')
        .insert([{
          name: quickVariationName,
          video_url: quickVariationVideoUrl,
          muscle_group: newExercise.muscle_group || 'Geral',
          instructions: 'Variação criada rapidamente.',
        }])
        .select()
        .single();

      if (exError) throw exError;

      // 2. Link as variation if editing an exercise
      if (newEx) {
        // Just add to local currentVariations state
        // The actual linking happens when handleSaveExercise is called (if editing)
        // OR we can link it NOW if editingExerciseId exists
        if (editingExerciseId) {
          const { error: varError } = await supabase
            .from('exercise_variations')
            .insert([{
              exercise_id: editingExerciseId,
              variation_id: newEx.id
            }]);
          
          if (varError) throw varError;
        }
        
        setCurrentVariations([...currentVariations, newEx.id]);
      }

      // Refresh available exercises list to show in selects/list
      await fetchExercises();
      
      // Reset form
      setQuickVariationName('');
      setQuickVariationVideoUrl('');
      setIsCreatingQuickVariation(false);
      alert('Variação criada e vinculada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar variação rápida:', error);
      alert('Erro ao criar variação.');
    } finally {
      setIsSavingQuickVariation(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const cats: { [key: string]: string } = {
      'Peito': 'bg-red-400',
      'Costas': 'bg-blue-400',
      'Pernas': 'bg-lime-400',
      'Ombros': 'bg-orange-400',
      'Braços': 'bg-purple-400',
      'Core': 'bg-yellow-400',
      'Cardio': 'bg-pink-400'
    };
    return cats[category] || 'bg-zinc-400';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans p-6 md:p-10">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div className="flex items-center space-x-4">
          <div className="bg-lime-400 p-2 border-2 border-black rotate-[-3deg] shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            < ShieldCheck className="text-black" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Painel <span className="text-lime-400">Geral</span></h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Status do Ecossistema Leveling</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button onClick={() => navigate('/admin/registrations')} variant="secondary" className="bg-lime-400 text-black hover:bg-lime-500 text-xs font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <UserPlus size={18} className="mr-2" /> Membros
          </Button>
          <Button onClick={() => navigate('/admin/avatars')} variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600 text-xs font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <ImageIcon size={18} className="mr-2" /> Biblioteca de Avatares
          </Button>
          <Button onClick={() => setIsLibraryOpen(true)} variant="secondary" className="bg-white text-black hover:bg-zinc-200 text-xs font-black uppercase italic">
            <BookOpen size={18} className="mr-2" /> Biblioteca de Exercícios
          </Button>
          <Button onClick={() => navigate('/workout')} variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white text-xs">
            Visualizar Interface Aluno
          </Button>
          <Button onClick={handleLogout} variant="ghost" className="text-zinc-500 hover:text-red-400 text-xs uppercase font-black">
            <LogOut size={18} className="mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
           <div className="bg-zinc-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(163,230,53,1)]">
              <div className="flex justify-between items-start mb-4">
                <Users className="text-lime-400" size={24} />
                <span className="text-[10px] font-black uppercase bg-lime-400/10 text-lime-400 px-2 py-1 border border-lime-400/20">Ativos</span>
              </div>
              <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Total de Alunos</h3>
              <p className="text-5xl font-black italic tracking-tighter">{students.length}</p>
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
                {students.map((student) => {
                  const studentDisplayName = student.nickname || student.full_name || student.email;
                  const studentInitials = (student.nickname || student.full_name || student.email || '?')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);

                  return (
                    <div key={student.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-zinc-800 transition-colors group">
                      <div 
                        className="flex items-center space-x-4 cursor-pointer flex-1"
                        onClick={() => setSelectedStudent(student)}
                      >
                         <div className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center font-black text-black italic text-xl group-hover:bg-lime-400 transition-colors shrink-0 overflow-hidden">
                            {((student.avatar_url && !student.avatar_url.includes('mage-low-m.jpg')) || getDynamicAvatar(student)) ? (
                              <img 
                                src={student.avatar_url || getDynamicAvatar(student)!} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).onerror = null;
                                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name || student.email)}&background=000&color=fff&bold=true`;
                                }}
                              />
                            ) : (
                              student.role?.toLowerCase() === 'professor' ? <GraduationCap size={24} className="text-blue-600" /> : studentInitials
                            )}
                         </div>
                         <div className="w-full overflow-hidden">
                          <h4 className="text-xl font-black uppercase italic group-hover:text-lime-400 transition-colors truncate max-w-[250px]">{studentDisplayName}</h4>
                          <div className="flex flex-wrap gap-3 mt-1 text-zinc-500">
                            <span className="text-[9px] font-black uppercase tracking-widest flex items-center"><Mail size={10} className="mr-1" /> {student.email}</span>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-black text-zinc-400 border border-zinc-800 flex items-center"><Brain size={10} className="mr-1" /> {student.goal || 'No Goal'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        <button 
                          onClick={() => navigate(`/progress`)}
                          className="p-2 border-2 border-zinc-800 text-zinc-500 hover:text-white hover:border-white transition-all flex items-center space-x-2"
                        >
                          <TrendingUp size={18} />
                          <span className="text-[10px] font-black uppercase">Progresso</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
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

      {/* Modal Brutalista de Detalhes do Aluno */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-white text-black border-4 border-black w-full max-w-4xl overflow-y-auto max-h-[90vh] shadow-[16px_16px_0px_0px_rgba(163,230,53,1)]">
            <div className="bg-black text-white p-6 flex justify-between items-center border-b-4 border-black sticky top-0 z-50">
               <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                 {isBuildingWorkout ? (editingWorkoutId ? 'Editar Treino' : 'Construtor de Treino') : isViewingWorkouts ? 'Treinos do Aluno' : 'Ficha do Atleta'}
               </h2>
               <button 
                onClick={() => {
                  setSelectedStudent(null);
                  setIsBuildingWorkout(false);
                  setIsViewingWorkouts(false);
                  setEditingWorkoutId(null);
                }} 
                className="hover:text-lime-400 transition-colors"
              >
                  <X size={32} strokeWidth={3} />
               </button>
            </div>

            <div className="p-8 space-y-8">
               {isViewingWorkouts ? (
                 <div className="space-y-6">
                    {studentWorkouts.length > 0 ? (
                      studentWorkouts.map((workout) => (
                        <div key={workout.id} className="bg-white border-4 border-black overflow-hidden group">
                           <div className="bg-black text-white p-4 flex justify-between items-center">
                              <div>
                                <h4 className="text-xl font-black uppercase italic tracking-tight">{workout.name}</h4>
                                <p className="text-lime-400 text-[10px] font-black uppercase tracking-widest">{workout.division}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handleEditWorkout(workout)}
                                  className="p-2 bg-zinc-800 text-white hover:bg-white hover:text-black transition-all border border-zinc-700"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button 
                                  onClick={() => setWorkoutToDelete(workout.id)}
                                  disabled={isDeletingWorkout === workout.id}
                                  className="p-2 bg-red-900/20 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-900/30"
                                >
                                  {isDeletingWorkout === workout.id ? <Clock size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                </button>
                              </div>
                           </div>
                           <div className="p-4 bg-zinc-50 border-t-2 border-black space-y-2">
                              {workout.exercises?.map((ex: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-xs border-b border-zinc-200 pb-1 last:border-0 last:pb-0">
                                   <span className="font-bold uppercase text-zinc-600">{idx + 1}. {ex.name}</span>
                                   <span className="font-black text-zinc-400 italic">{ex.sets}x{ex.reps}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center border-4 border-dashed border-zinc-200 bg-zinc-50">
                        <Dumbbell size={48} className="mx-auto text-zinc-200 mb-4" />
                        <p className="text-zinc-400 font-black uppercase italic tracking-widest">Nenhum treino arquivado</p>
                      </div>
                    )}
                 </div>
               ) : !isBuildingWorkout ? (
                 <>
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="w-24 h-24 bg-zinc-950 border-4 border-black flex items-center justify-center shrink-0 overflow-hidden">
                        {((selectedStudent.avatar_url && !selectedStudent.avatar_url.includes('mage-low-m.jpg')) || getDynamicAvatar(selectedStudent)) ? (
                          <img 
                            src={selectedStudent.avatar_url || getDynamicAvatar(selectedStudent)!} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).onerror = null;
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent.full_name || selectedStudent.email)}&background=000&color=fff&bold=true`;
                            }}
                          />
                        ) : (
                          selectedStudent.role?.toLowerCase() === 'professor' ? (
                            <GraduationCap size={48} className="text-blue-600" />
                          ) : (
                            <span className="text-3xl font-black text-white italic">
                              {(selectedStudent.nickname || selectedStudent.full_name || selectedStudent.email || '?')
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .substring(0, 2)}
                            </span>
                          )
                        )}
                      </div>
                      <div className="space-y-4 w-full">
                        <div>
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Identificação</h3>
                          <p className="text-2xl font-black uppercase leading-none break-all">{selectedStudent.full_name}</p>
                          {selectedStudent.nickname && (
                            <p className="text-lime-600 font-black italic uppercase text-lg mt-1">@{selectedStudent.nickname}</p>
                          )}
                          <div className="flex items-center mt-1">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-black text-white border border-black">
                              {selectedStudent.gender || 'Não informado'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-sm font-bold text-zinc-600">
                           <Mail size={16} className="mr-2" /> {selectedStudent.email}
                        </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-zinc-100 border-2 border-black p-4">
                        <Ruler size={20} className="mb-2 text-zinc-400" />
                        <p className="text-[8px] font-black uppercase text-zinc-500">Altura</p>
                        <p className="text-xl font-black italic">{selectedStudent.height}cm</p>
                      </div>
                      <div className="bg-zinc-100 border-2 border-black p-4">
                        <Scale size={20} className="mb-2 text-zinc-400" />
                        <p className="text-[8px] font-black uppercase text-zinc-500">Peso</p>
                        <p className="text-xl font-black italic">{selectedStudent.weight}kg</p>
                      </div>
                      <div className="bg-zinc-100 border-2 border-black p-4">
                        <Activity size={20} className="mb-2 text-blue-500" />
                        <p className="text-[8px] font-black uppercase text-zinc-500">IMC</p>
                        <p className="text-xl font-black italic">
                          {calculateIMC(selectedStudent.weight, selectedStudent.height) || '--'}
                        </p>
                        {selectedStudent.weight && selectedStudent.height && (
                          <p className={`text-[8px] font-bold uppercase mt-1 ${getIMCStatus(Number(calculateIMC(selectedStudent.weight, selectedStudent.height))).color}`}>
                            {getIMCStatus(Number(calculateIMC(selectedStudent.weight, selectedStudent.height))).label}
                          </p>
                        )}
                      </div>
                      <div className="bg-zinc-100 border-2 border-black p-4">
                        <Zap size={20} className="mb-2 text-lime-600" />
                        <p className="text-[8px] font-black uppercase text-zinc-500">Level</p>
                        <p className="text-xl font-black italic">{selectedStudent.level}</p>
                      </div>
                      <div className="bg-zinc-100 border-2 border-black p-4">
                        <User size={20} className="mb-2 text-zinc-400" />
                        <p className="text-[8px] font-black uppercase text-zinc-500">Idade</p>
                        <p className="text-xl font-black italic">{selectedStudent.age || '--'}</p>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div className="bg-black text-white p-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <Brain size={20} className="mr-3 text-lime-400" />
                            <div>
                              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Objetivo Principal</p>
                              <p className="text-sm font-black uppercase italic">{selectedStudent.goal || 'Não definido'}</p>
                            </div>
                        </div>
                      </div>

                      <div className="bg-zinc-100 border-4 border-black p-4">
                          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1">Nível de Experiência / Tempo</p>
                          <p className="font-bold text-zinc-800 uppercase italic">{selectedStudent.training_period || 'Não informado'}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-zinc-900 text-white p-4 flex items-center">
                          <Clock size={20} className="mr-3 text-lime-400" />
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Período Ideal</p>
                            <p className="text-sm font-black uppercase italic">{selectedStudent.training_time || 'Não informado'}</p>
                          </div>
                        </div>
                        <div className="bg-zinc-900 text-white p-4 flex items-center">
                          <Calendar size={20} className="mr-3 text-lime-400" />
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Frequência</p>
                            <p className="text-sm font-black uppercase italic">{selectedStudent.training_days_per_week ? `${selectedStudent.training_days_per_week} dias/semana` : 'Não definido'}</p>
                          </div>
                        </div>
                      </div>
                  </div>
                 </>
               ) : (
                 <div className="space-y-8">
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Título do Treino</label>
                             <input 
                               type="text" 
                               value={workoutTitle || ''}
                               onChange={(e) => setWorkoutTitle(e.target.value)}
                               className="w-full bg-zinc-100 border-4 border-black p-4 text-xl font-black placeholder:text-zinc-300 focus:outline-none focus:bg-white transition-colors"
                               placeholder="EX: FULL BODY INICIANTE"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Divisão</label>
                             <select 
                               value={workoutDivision || 'Treino A'}
                               onChange={(e) => setWorkoutDivision(e.target.value)}
                               className="w-full bg-zinc-100 border-4 border-black p-4 text-xl font-black focus:outline-none focus:bg-white transition-colors uppercase italic"
                             >
                                <option>Treino A</option>
                                <option>Treino B</option>
                                <option>Treino C</option>
                                <option>Full Body</option>
                                <option>Cardio</option>
                                <option>Mobilidade</option>
                             </select>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="flex justify-between items-end">
                          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Exercícios Selecionados ({selectedExercises.length})</h4>
                          <div className="relative">
                             <select 
                               className="bg-black text-white p-2 text-xs font-black uppercase italic border-2 border-black focus:outline-none"
                               onChange={(e) => handleAddExercise(e.target.value)}
                               value=""
                             >
                               <option value="" disabled>+ Adicionar Exercício</option>
                               {availableExercises.map(ex => (
                                 <option key={ex.id} value={ex.id}>{ex.name}</option>
                               ))}
                             </select>
                          </div>
                       </div>

                       <div className="space-y-4">
                          {selectedExercises.map((ex, index) => (
                            <div key={ex.id} className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                  <div className="flex items-center flex-1">
                                    <span className="w-10 h-10 flex items-center justify-center bg-black text-lime-400 font-black italic mr-4 shrink-0 border-2 border-black">
                                      {index + 1}
                                    </span>
                                    <div>
                                      <h5 className="font-black uppercase italic tracking-tighter text-xl leading-none">{ex.name}</h5>
                                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{ex.category}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                                    <div className="flex-1 md:flex-none">
                                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Séries</label>
                                      <input 
                                        type="text"
                                        value={ex.sets}
                                        onChange={(e) => {
                                          const newExs = [...selectedExercises];
                                          newExs[index].sets = e.target.value;
                                          setSelectedExercises(newExs);
                                        }}
                                        className="w-full md:w-16 bg-zinc-50 border-2 border-black p-2 text-center font-black focus:bg-lime-50 transition-colors"
                                      />
                                    </div>
                                    <div className="flex-1 md:flex-none">
                                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Reps</label>
                                      <input 
                                        type="text"
                                        value={ex.reps}
                                        onChange={(e) => {
                                          const newExs = [...selectedExercises];
                                          newExs[index].reps = e.target.value;
                                          setSelectedExercises(newExs);
                                        }}
                                        className="w-full md:w-24 bg-zinc-50 border-2 border-black p-2 text-center font-black focus:bg-lime-50 transition-colors"
                                      />
                                    </div>
                                    <div className="flex-1 md:flex-none">
                                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Carga</label>
                                      <input 
                                        type="text"
                                        value={ex.weight}
                                        onChange={(e) => {
                                          const newExs = [...selectedExercises];
                                          newExs[index].weight = e.target.value;
                                          setSelectedExercises(newExs);
                                        }}
                                        placeholder="Peso"
                                        className="w-full md:w-24 bg-zinc-50 border-2 border-black p-2 text-center font-black focus:bg-lime-50 transition-colors"
                                      />
                                    </div>
                                    <button 
                                      onClick={() => setSelectedExercises(selectedExercises.filter(e => e.id !== ex.id))}
                                      className="p-2 text-zinc-400 hover:text-red-600 transition-colors self-end md:self-center"
                                    >
                                      <Trash2 size={20} />
                                    </button>
                                  </div>
                               </div>
                            </div>
                          ))}
                          {selectedExercises.length === 0 && (
                            <div className="border-4 border-dashed border-zinc-200 p-8 text-center bg-zinc-50">
                               <ListChecks size={32} className="mx-auto text-zinc-200 mb-2" />
                               <p className="text-[10px] font-black uppercase text-zinc-300">Nenhum exercício selecionado</p>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="p-6 bg-zinc-100 border-t-4 border-black flex flex-col md:flex-row gap-4 justify-end sticky bottom-0 z-50">
               {isViewingWorkouts ? (
                  <button 
                    onClick={() => setIsViewingWorkouts(false)}
                    className="px-10 py-4 border-4 border-black font-black uppercase italic tracking-tighter hover:bg-zinc-200 transition-colors w-full md:w-auto"
                  >
                    VOLTAR
                  </button>
               ) : isBuildingWorkout ? (
                 <>
                   <button 
                     onClick={() => {
                        setIsBuildingWorkout(false);
                        setEditingWorkoutId(null);
                        setWorkoutTitle('');
                        setSelectedExercises([]);
                     }}
                     className="px-6 py-4 border-4 border-black font-black uppercase italic tracking-tighter hover:bg-zinc-200 transition-colors"
                   >
                     CANCELAR
                   </button>
                   <button 
                     onClick={handleSaveWorkout}
                     disabled={isSavingWorkout || !workoutTitle || selectedExercises.length === 0}
                     className="px-10 py-4 bg-black text-white font-black uppercase italic tracking-tighter hover:bg-zinc-800 transition-all shadow-[4px_4px_0px_0px_rgba(163,230,53,1)] disabled:opacity-50 flex items-center justify-center"
                   >
                     {isSavingWorkout ? 'SALVANDO...' : (
                       <>
                         <Save size={20} className="mr-2" /> {editingWorkoutId ? 'ATUALIZAR TREINO' : 'SALVAR TREINO'}
                       </>
                     )}
                   </button>
                 </>
               ) : (
                 <>
                   <button 
                     onClick={() => {
                       setSelectedStudent(null);
                       setIsBuildingWorkout(false);
                       setIsViewingWorkouts(false);
                     }}
                     className="px-10 py-4 border-4 border-black font-black uppercase italic tracking-tighter hover:bg-zinc-200 transition-colors order-3 md:order-1"
                   >
                     FECHAR
                   </button>
                   <button 
                     onClick={() => {
                       setIsViewingWorkouts(true);
                       fetchStudentWorkouts(selectedStudent.id);
                     }}
                     className="px-10 py-4 bg-zinc-800 text-white border-4 border-black font-black uppercase italic tracking-tighter hover:bg-black transition-all order-2 md:order-2 flex items-center justify-center"
                   >
                     <Clock size={20} className="mr-2" /> VER TREINOS
                   </button>
                   <button 
                     onClick={() => setIsBuildingWorkout(true)}
                     className="px-10 py-4 bg-lime-400 text-black border-4 border-black font-black uppercase italic tracking-tighter hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all order-1 md:order-3 flex items-center justify-center"
                   >
                     <Plus size={20} className="mr-2" strokeWidth={3} /> MONTAR TREINO
                   </button>
                 </>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Biblioteca de Exercícios */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-black/90 backdrop-blur-md">
          <div className="bg-white text-black border-4 border-black w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-[20px_20px_0px_0px_rgba(163,230,53,1)]">
             <div className="bg-black text-white p-8 flex justify-between items-center border-b-4 border-black">
                <div className="flex items-center">
                  <BookOpen className="text-lime-400 mr-4" size={40} />
                  <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Biblioteca de Exercícios</h2>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2">{availableExercises.length} Exercícios Cadastrados</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                   <button 
                    onClick={() => {
                      if (isAddingExercise) {
                        setIsAddingExercise(false);
                        setEditingExerciseId(null);
                        setNewExercise({ name: '', muscle_group: '', instructions: '', video_url: '' });
                      } else {
                        setIsAddingExercise(true);
                      }
                    }}
                    className={`px-6 py-3 border-4 border-white font-black uppercase italic text-sm transition-all flex items-center ${isAddingExercise ? 'bg-white text-black' : 'hover:bg-zinc-800'}`}
                   >
                     {(isAddingExercise || editingExerciseId) ? <Trash2 size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
                     {(isAddingExercise || editingExerciseId) ? 'Cancelar' : 'Novo Exercício'}
                   </button>
                   <button onClick={() => setIsLibraryOpen(false)} className="hover:text-lime-400 transition-colors">
                      <X size={40} strokeWidth={3} />
                   </button>
                </div>
             </div>

             <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {isAddingExercise ? (
                  <div className="w-full p-10 overflow-y-auto bg-zinc-100">
                    <div className="max-w-2xl mx-auto space-y-8">
                       <h3 className="text-4xl font-black uppercase italic tracking-tighter mb-10 underline decoration-lime-400 decoration-8 underline-offset-4">
                          {editingExerciseId ? 'Editar Exercício' : 'Cadastro de Exercício'}
                       </h3>

                       <div className="bg-white border-4 border-black p-6 space-y-4">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                             <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center">
                               <RefreshCcw size={14} className="mr-2" /> Variações Sugeridas ({currentVariations.length})
                             </label>
                             <div className="flex gap-2">
                               <button 
                                 type="button"
                                 onClick={() => {
                                   setIsCreatingQuickVariation(!isCreatingQuickVariation);
                                   setIsAddingVariation(false);
                                 }}
                                 className="text-[10px] font-black uppercase bg-lime-400 text-black px-3 py-1 hover:bg-black hover:text-white transition-colors border-2 border-black"
                               >
                                 {isCreatingQuickVariation ? 'FECHAR' : '+ CRIAR NOVA VARIAÇÃO'}
                               </button>
                               <button 
                                 type="button"
                                 onClick={() => {
                                   setIsAddingVariation(!isAddingVariation);
                                   setIsCreatingQuickVariation(false);
                                 }}
                                 className="text-[10px] font-black uppercase bg-black text-white px-3 py-1 hover:bg-lime-500 hover:text-black transition-colors"
                               >
                                 {isAddingVariation ? 'FECHAR' : '+ ADICIONAR EXISTENTE'}
                               </button>
                             </div>
                          </div>

                          {isCreatingQuickVariation && (
                            <div className="border-4 border-black p-4 space-y-4 bg-lime-50">
                               <h4 className="text-xs font-black uppercase tracking-widest text-black underline decoration-lime-400">Nova Variação Rápida</h4>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-zinc-500">Nome do Exercício</label>
                                    <input 
                                      type="text"
                                      value={quickVariationName}
                                      onChange={(e) => setQuickVariationName(e.target.value)}
                                      placeholder="Ex: Supino Inclinado com Halteres"
                                      className="w-full bg-white border-2 border-black p-2 text-sm font-black focus:outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-zinc-500">Link do Vídeo (Opcional)</label>
                                    <input 
                                      type="text"
                                      value={quickVariationVideoUrl}
                                      onChange={(e) => setQuickVariationVideoUrl(e.target.value)}
                                      placeholder="URL do Youtube/Drive"
                                      className="w-full bg-white border-2 border-black p-2 text-sm font-black focus:outline-none"
                                    />
                                  </div>
                               </div>
                               <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={handleCreateQuickVariation}
                                    disabled={isSavingQuickVariation || !quickVariationName}
                                    className="bg-black text-white px-6 py-2 text-xs font-black uppercase italic hover:bg-lime-500 hover:text-black transition-all disabled:opacity-50"
                                  >
                                    {isSavingQuickVariation ? 'SALVANDO...' : 'CRIAR E VINCULAR'}
                                  </button>
                               </div>
                            </div>
                          )}

                          {isAddingVariation && (
                            <div className="border-2 border-black/10 p-4 max-h-[250px] overflow-y-auto space-y-2 bg-zinc-50">
                               {availableExercises
                                 .filter(ex => ex.id !== editingExerciseId && !currentVariations.includes(ex.id))
                                 .map(ex => (
                                   <button
                                     key={ex.id}
                                     type="button"
                                     onClick={() => setCurrentVariations([...currentVariations, ex.id])}
                                     className="w-full text-left p-3 border-2 border-black bg-white hover:bg-lime-400 transition-colors flex justify-between items-center"
                                   >
                                     <span className="font-black uppercase italic text-sm">{ex.name}</span>
                                     <Plus size={16} />
                                   </button>
                                 ))
                               }
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                             {currentVariations.map(vId => {
                               const ex = availableExercises.find(e => e.id === vId);
                               return (
                                 <div key={vId} className="bg-lime-400 border-2 border-black px-2 py-1 flex items-center">
                                   <span className="text-[9px] font-black uppercase italic mr-2">{ex?.name}</span>
                                   <button type="button" onClick={() => setCurrentVariations(currentVariations.filter(id => id !== vId))}>
                                     <X size={12} strokeWidth={3} />
                                   </button>
                                 </div>
                               );
                             })}
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                             <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Nome do Exercício</label>
                             <input 
                               type="text"
                               value={newExercise.name}
                               onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                               className="w-full bg-white border-4 border-black p-4 text-xl font-black placeholder:text-zinc-200 focus:outline-none"
                               placeholder="Ex: Supino Reto"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Grupo Muscular</label>
                             <select 
                               value={newExercise.muscle_group}
                               onChange={(e) => setNewExercise({...newExercise, muscle_group: e.target.value})}
                               className="w-full bg-white border-4 border-black p-4 text-xl font-black focus:outline-none appearance-none uppercase italic"
                             >
                                <option value="">Selecione...</option>
                                <option value="Peito">Peito</option>
                                <option value="Costas">Costas</option>
                                <option value="Pernas">Pernas</option>
                                <option value="Ombros">Ombros</option>
                                <option value="Braços">Braços</option>
                                <option value="Core">Core</option>
                                <option value="Cardio">Cardio</option>
                             </select>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Instruções de Execução</label>
                          <textarea 
                            value={newExercise.instructions}
                            onChange={(e) => setNewExercise({...newExercise, instructions: e.target.value})}
                            rows={4}
                            className="w-full bg-white border-4 border-black p-4 text-lg font-bold placeholder:text-zinc-200 focus:outline-none resize-none"
                            placeholder="Descreva passo a passo como realizar o movimento..."
                          />
                       </div>

                       <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center">
                            <Video size={14} className="mr-2" /> Link do Vídeo / GIF (Demonstração)
                          </label>
                          <input 
                            type="url"
                            value={newExercise.video_url}
                            onChange={(e) => setNewExercise({...newExercise, video_url: e.target.value})}
                            className="w-full bg-white border-4 border-black p-4 text-lg font-bold placeholder:text-zinc-200 focus:outline-none"
                            placeholder="https://youtube.com/watch?v=..."
                          />
                       </div>

                       <button 
                        onClick={handleSaveExercise}
                        disabled={isSavingExercise || !newExercise.name || !newExercise.muscle_group}
                        className="w-full py-6 bg-black text-white font-black uppercase italic text-2xl tracking-tighter hover:bg-zinc-800 transition-all shadow-[8px_8px_0px_0px_rgba(163,230,53,1)] flex items-center justify-center disabled:opacity-50"
                       >
                         {isSavingExercise ? 'SALVANDO...' : (editingExerciseId ? 'ATUALIZAR EXERCÍCIO' : 'CADASTRAR EXERCÍCIO')}
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full p-8 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-zinc-200">
                     {availableExercises.map(ex => (
                       <div key={ex.id} className="bg-white border-4 border-black flex flex-col group hover:translate-y-[-4px] hover:translate-x-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                          <div className={`h-2 ${getCategoryColor(ex.category)} border-b-4 border-black`}></div>
                          <div className="p-4 flex-1">
                             <span className="text-[8px] font-black uppercase bg-black text-white px-2 py-0.5 mb-2 inline-block italic tracking-widest">
                               {ex.category}
                             </span>
                             <h4 className="text-xl font-black uppercase italic tracking-tighter leading-tight break-words">{ex.name}</h4>
                          </div>
                          <div className="p-4 border-t-4 border-black flex justify-between bg-zinc-50">
                             <div className="flex space-x-2">
                                <button className="p-1 text-zinc-400 hover:text-black transition-colors" title="Ver Detalhes">
                                   <Info size={18} />
                                </button>
                                <button 
                                  className="p-1 text-zinc-400 hover:text-lime-600 transition-colors" 
                                  title="Editar"
                                  onClick={async () => {
                                    setEditingExerciseId(ex.id);
                                    setNewExercise({
                                      name: ex.name || '',
                                      muscle_group: ex.category || '',
                                      instructions: (ex as any).instructions || '',
                                      video_url: (ex as any).video_url || ''
                                    });

                                    // Fetch variations
                                    try {
                                      const { data: varData } = await supabase
                                        .from('exercise_variations')
                                        .select('variation_id')
                                        .eq('exercise_id', ex.id);
                                      
                                      if (varData) {
                                        setCurrentVariations(varData.map((v: any) => v.variation_id));
                                      } else {
                                        setCurrentVariations([]);
                                      }
                                    } catch (err) {
                                      console.error("Error fetching variations:", err);
                                      setCurrentVariations([]);
                                    }

                                    setIsAddingExercise(true);
                                  }}
                                >
                                   <Pencil size={18} />
                                </button>
                                <button 
                                  className="p-1 text-zinc-400 hover:text-red-500 transition-colors" 
                                  title="Excluir"
                                  onClick={async () => {
                                    if (confirm('Tem certeza que deseja excluir este exercício?')) {
                                      const { error } = await supabase.from('exercises').delete().eq('id', ex.id);
                                      if (error) alert('Erro ao excluir exercício.'); else fetchExercises();
                                    }
                                  }}
                                >
                                   <Trash2 size={18} />
                                </button>
                             </div>
                             {/* No real link checking here for brevity, just visual placeholder */}
                             <div className="flex space-x-1">
                               <div className="w-2 h-2 rounded-full bg-lime-500 border border-black"></div>
                             </div>
                          </div>
                       </div>
                     ))}
                     {availableExercises.length === 0 && (
                       <div className="col-span-full h-full flex flex-col items-center justify-center p-20 text-center">
                          <Dumbbell size={80} className="text-zinc-300 mb-6" />
                          <p className="text-2xl font-black uppercase italic text-zinc-400">Nenhum exercício na biblioteca</p>
                          <button 
                            onClick={() => setIsAddingExercise(true)}
                            className="mt-6 px-10 py-4 bg-black text-white font-black uppercase italic tracking-tighter hover:bg-zinc-800 transition-all shadow-[4px_4px_0px_0px_rgba(163,230,53,1)]"
                          >
                            Cadastrar o Primeiro
                          </button>
                       </div>
                     )}
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal for Deletion */}
      <AnimatePresence>
        {workoutToDelete && (
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
              className="bg-white border-4 border-black w-full max-w-sm p-8 shadow-[16px_16px_0px_0px_rgba(239,68,68,1)]"
            >
              <div className="flex items-center text-red-600 mb-4">
                <AlertTriangle size={40} className="mr-3" strokeWidth={3} />
                <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Cuidado!</h3>
              </div>
              
              <p className="font-bold text-zinc-600 italic mb-8">
                Tem certeza que deseja excluir este treino permanentemente? Esta ação não pode ser desfeita.
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => handleDeleteWorkout(workoutToDelete)}
                  disabled={!!isDeletingWorkout}
                  className="w-full py-4 bg-red-600 text-white font-black uppercase italic text-xl border-4 border-black hover:bg-red-700 transition-all flex items-center justify-center"
                >
                  {isDeletingWorkout ? <Clock className="animate-spin mr-2" /> : <Trash2 size={24} className="mr-2" />}
                  EXCLUIR TREINO
                </button>
                <button 
                  onClick={() => setWorkoutToDelete(null)}
                  className="w-full py-4 bg-white text-black font-black uppercase italic text-xl border-4 border-black hover:bg-zinc-100 transition-all"
                >
                  CANCELAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
