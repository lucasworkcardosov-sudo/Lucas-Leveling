import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Exercise } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Dumbbell, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  PlayCircle, 
  Calendar, 
  TrendingUp, 
  ChevronRight,
  Loader2,
  X,
  Save,
  Image as ImageIcon,
  History,
  Info,
  ArrowLeft,
  LogOut,
  Eye,
  Menu,
  GraduationCap,
  LayoutList
} from 'lucide-react';
import { getDynamicAvatar } from '../lib/avatarLibrary';
import { Button } from '../components/ui/Button';

interface StudentWithStats extends Profile {
  last_workout?: {
    created_at: string;
    xp_gained: number;
    workout_name?: string;
  };
}

export const ProfessorDashboard = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'exercises'>('students');
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  // Exercise states
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Partial<Exercise> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Student Diary state
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  // Workout Builder States
  const [isBuildingWorkout, setIsBuildingWorkout] = useState(false);
  const [isViewingWorkouts, setIsViewingWorkouts] = useState(false);
  const [studentWorkouts, setStudentWorkouts] = useState<any[]>([]);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDivision, setWorkoutDivision] = useState('Treino A');
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [workoutSets, setWorkoutSets] = useState('3');
  const [workoutReps, setWorkoutReps] = useState('10-12');
  const [workoutWeight, setWorkoutWeight] = useState('');

  useEffect(() => {
    fetchUserData();
    fetchData();
  }, [activeTab]);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        setUserProfile(data || null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserProfile(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (activeTab === 'students') {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'aluno')
          .eq('instructor_id', user.id) // ONLY students assigned to this professor
          .order('level', { ascending: false });

        if (profilesError) throw profilesError;

        // Fetch last workout for each student
        const studentsWithLastWorkout = await Promise.all((profiles || []).map(async (student) => {
          const { data: history, error: historyError } = await supabase
            .from('workout_history')
            .select('created_at, xp_gained')
            .eq('student_id', student.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...student,
            last_workout: history || undefined
          };
        }));

        setStudents(studentsWithLastWorkout);
      } else {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*')
          .order('name', { ascending: true });

        if (exercisesError) throw exercisesError;
        setExercises(exercisesData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentHistory = async (studentId: string) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('workout_history')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudentHistory(data || []);
    } catch (error) {
      console.error('Error fetching student history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenDiary = (student: StudentWithStats) => {
    setSelectedStudent(student);
    fetchStudentHistory(student.id);
    fetchStudentWorkouts(student.id);
  };

  const fetchStudentWorkouts = async (studentId: string) => {
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
    }
  };

  const handleAddExerciseToWorkout = (exercise: Exercise) => {
    if (!selectedExercises.find(e => e.id === exercise.id)) {
      setSelectedExercises([...selectedExercises, { 
        id: exercise.id, 
        name: exercise.name,
        category: exercise.muscle_group,
        instructions: exercise.description,
        video_url: exercise.media_url,
        sets: workoutSets || '3',
        reps: workoutReps || '10-12',
        weight: workoutWeight || ''
      }]);
    }
  };

  const handleSaveWorkout = async () => {
    if (!selectedStudent || !workoutTitle || selectedExercises.length === 0) {
      alert('Preencha o título e selecione ao menos um exercício.');
      return;
    }
    
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
          muscle_group: ex.category || ex.muscle_group,
          instructions: ex.instructions || ex.description,
          video_url: ex.video_url || ex.media_url,
          sets: ex.sets || '3',
          reps: ex.reps || '10-12',
          weight: ex.weight || '',
          rest_time: 60,
          order_index: index
        }))
      };

      if (editingWorkoutId) {
        const { error } = await supabase
          .from('workouts')
          .update(workoutData)
          .eq('id', editingWorkoutId);
        if (error) throw error;
        alert('Treino atualizado!');
      } else {
        const { error } = await supabase
          .from('workouts')
          .insert([workoutData]);
        if (error) throw error;
        alert('Novo treino atribuído!');
      }

      setIsBuildingWorkout(false);
      setEditingWorkoutId(null);
      setSelectedExercises([]);
      setWorkoutTitle('');
      fetchStudentWorkouts(selectedStudent.id);
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Erro ao salvar treino.');
    } finally {
      setIsSavingWorkout(false);
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

  const handleStudentPreview = () => {
    if (!selectedStudent) return;
    sessionStorage.setItem('preview_student_id', selectedStudent.id);
    navigate('/dashboard');
  };

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExercise?.name || !editingExercise?.muscle_group) return;

    if (userProfile?.role === 'aluno') {
      alert('Acesso negado: Apenas instrutores podem gerenciar exercícios.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name: editingExercise.name,
        description: editingExercise.description,
        muscle_group: editingExercise.muscle_group,
        media_url: editingExercise.media_url,
        last_edited_by: userProfile?.id || null // Added for logging
      };

      if (editingExercise.id) {
        const { error } = await supabase
          .from('exercises')
          .update(payload)
          .eq('id', editingExercise.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('exercises')
          .insert([payload]);
        if (error) throw error;
      }

      setIsExerciseModalOpen(false);
      setEditingExercise(null);
      fetchData();
    } catch (error) {
      console.error('Error saving exercise:', error);
      alert('Erro ao salvar exercício.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (userProfile?.role === 'aluno') {
      alert('Acesso negado: Apenas instrutores podem remover exercícios.');
      return;
    }
    
    if (!confirm('Tem certeza que deseja excluir este exercício?')) return;
    
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      alert('Erro ao excluir exercício.');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExercises = exercises.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.muscle_group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEffectiveStudent = (student: StudentWithStats) => ({
    ...student,
    class: student?.class || 'Iniciante'
  }) as StudentWithStats;

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <p className="font-black uppercase tracking-widest text-zinc-500 animate-pulse font-press text-[10px]">Carregando Quartel...</p>
      </div>
    );
  }

  const effectiveUserProfile = {
    ...userProfile,
    class: userProfile?.class || 'Iniciante'
  } as Profile;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500 selection:text-white">
      {/* Sidebar/Top Header */}
      <header className="bg-zinc-900 border-b-4 border-black p-4 md:p-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="bg-blue-600 p-2 md:p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <GraduationCap size={20} className="text-white md:w-6 md:h-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-2xl font-black uppercase tracking-tighter italic leading-none">Quartel de Mestres</h1>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none mt-1">Instrutor de Guilda</p>
            </div>
          </div>

          {/* Navigation Controls - Desktop & Tablet */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="flex bg-black p-1 border-2 border-black">
              <button 
                onClick={() => setActiveTab('students')}
                className={`px-4 py-1.5 md:px-6 md:py-2 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-zinc-500 hover:text-white'}`}
              >
                Meus Alunos
              </button>
              <button 
                onClick={() => setActiveTab('exercises')}
                className={`px-4 py-1.5 md:px-6 md:py-2 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'exercises' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-zinc-500 hover:text-white'}`}
              >
                Biblioteca
              </button>
            </div>

            <button 
              onClick={() => {
                sessionStorage.removeItem('preview_student_id');
                navigate('/dashboard');
              }}
              className="px-4 py-2 bg-zinc-950 border-2 border-black text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center group"
            >
              <Eye size={14} className="mr-2 group-hover:scale-110 transition-transform" />
              Visão de Aluno
            </button>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex flex-col items-end mr-1 hidden md:flex">
              <span className="text-[10px] font-black uppercase tracking-tight text-white line-clamp-1">{effectiveUserProfile?.nickname || effectiveUserProfile?.full_name?.split(' ')[0]}</span>
              <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">{effectiveUserProfile?.class || 'Mestre'}</span>
            </div>
            
            <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-black bg-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              {effectiveUserProfile?.avatar_url || getDynamicAvatar(effectiveUserProfile) ? (
                <img 
                  src={effectiveUserProfile?.avatar_url || getDynamicAvatar(effectiveUserProfile)!} 
                  alt="" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-black italic">
                   {effectiveUserProfile?.full_name?.substring(0, 2).toUpperCase() || 'M'}
                </div>
              )}
            </div>

            <button 
              onClick={handleLogout}
              className="p-2 md:px-4 md:py-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 border-2 border-transparent hover:border-red-950 transition-all flex items-center group"
              title="Sair da Sessão"
            >
              <LogOut size={16} className="md:mr-2 group-hover:translate-x-1 transition-transform" />
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Sair da Sessão</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation */}
        <div className="lg:hidden mt-4 flex items-center justify-between gap-2 border-t border-black pt-4">
          <div className="flex bg-black p-1 border-2 border-black flex-1">
            <button 
              onClick={() => setActiveTab('students')}
              className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'students' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}
            >
              Alunos
            </button>
            <button 
              onClick={() => setActiveTab('exercises')}
              className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'exercises' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}
            >
              Biblioteca
            </button>
          </div>

          <button 
            onClick={() => {
              sessionStorage.removeItem('preview_student_id');
              navigate('/dashboard');
            }}
            className="p-2 bg-zinc-950 border-2 border-black text-zinc-400 hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Visão de Aluno"
          >
            <Eye size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Search and Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder={activeTab === 'students' ? "Buscar recrutas por nome ou email..." : "Buscar exercícios por nome ou grupo..."}
              className="w-full bg-zinc-900 border-2 border-black p-4 pl-12 font-bold focus:outline-none focus:border-blue-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {activeTab === 'exercises' && (userProfile?.role === 'professor' || userProfile?.role === 'admin') && (
            <button 
              onClick={() => {
                setEditingExercise({ name: '', muscle_group: '', description: '', media_url: '' });
                setIsExerciseModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white border-2 border-black px-8 py-4 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center space-x-2 active:shadow-none active:translate-x-1 active:translate-y-1"
            >
              <Plus size={20} />
              <span>Novo Exercício</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="animate-spin text-blue-500" size={48} />
            <p className="font-black uppercase tracking-widest text-zinc-500 animate-pulse">Convocando dados...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'students' ? (
              filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const effectiveStudent = getEffectiveStudent(student);
                  return (
                  <div key={effectiveStudent.id} className="bg-zinc-900 border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:border-blue-600 transition-colors group">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-14 h-14 bg-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                            {effectiveStudent.avatar_url || getDynamicAvatar(effectiveStudent) ? (
                              <img src={effectiveStudent.avatar_url || getDynamicAvatar(effectiveStudent)!} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl font-black italic">
                                {effectiveStudent.full_name?.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-blue-600 border border-black text-[10px] font-black px-1.5 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            LVL {effectiveStudent.level}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-black uppercase tracking-tight text-lg group-hover:text-blue-400 transition-colors truncate max-w-[150px]">
                            {effectiveStudent.nickname || effectiveStudent.full_name}
                          </h3>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate max-w-[150px]">{effectiveStudent.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="bg-black/50 p-3 border border-zinc-800">
                        <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                          <span className="text-zinc-500">Progresso de XP</span>
                          <span className="text-blue-400">{effectiveStudent.xp % 500} / 500</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${(effectiveStudent.xp % 500) / 5}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                        <div className="flex items-center text-zinc-500">
                          <Calendar size={14} className="mr-2" />
                          Último Treino
                        </div>
                        <span className="text-zinc-300">
                          {effectiveStudent.last_workout ? new Date(effectiveStudent.last_workout.created_at).toLocaleDateString('pt-BR') : 'Sem registros'}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleOpenDiary(effectiveStudent)}
                      className="w-full bg-black hover:bg-zinc-800 border-2 border-black p-3 font-black uppercase tracking-widest text-[11px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center space-x-2"
                    >
                      <History size={16} />
                      <span>Ver Diário de Treino</span>
                    </button>
                  </div>
                );
              })
              ) : (
                <div className="col-span-full border-4 border-dashed border-zinc-800 p-20 text-center">
                  <Users className="mx-auto text-zinc-800 mb-4" size={64} />
                  <p className="font-black uppercase tracking-widest text-zinc-600">Nenhum recruta encontrado.</p>
                </div>
              )
            ) : (
              filteredExercises.length > 0 ? (
                filteredExercises.map((exercise) => (
                  <div key={exercise.id} className="bg-zinc-900 border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col group hover:border-blue-600 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] italic">
                          {exercise.muscle_group}
                        </span>
                        {(userProfile?.role === 'professor' || userProfile?.role === 'admin') && (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                setEditingExercise(exercise);
                                setIsExerciseModalOpen(true);
                              }}
                              className="p-2 hover:bg-blue-600 border border-zinc-800 hover:border-black transition-all group/btn"
                            >
                              <Edit2 size={16} className="text-zinc-500 group-hover/btn:text-white" />
                            </button>
                            <button 
                              onClick={() => handleDeleteExercise(exercise.id)}
                              className="p-2 hover:bg-red-600 border border-zinc-800 hover:border-black transition-all group/btn"
                            >
                              <Trash2 size={16} className="text-zinc-500 group-hover/btn:text-white" />
                            </button>
                          </div>
                        )}
                      </div>

                      <h3 className="text-xl font-black uppercase tracking-tighter italic mb-2 group-hover:text-blue-400 transition-colors">{exercise.name}</h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed line-clamp-3 mb-4">
                        {exercise.description || 'Sem descrição cadastrada.'}
                      </p>
                    </div>

                    <div className="aspect-video bg-black border-2 border-black overflow-hidden relative group/img cursor-pointer">
                      {exercise.media_url ? (
                        <img src={exercise.media_url} alt="" className="w-full h-full object-cover grayscale group-hover/img:grayscale-0 transition-all duration-500" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800 bg-zinc-900/50">
                          <ImageIcon size={32} strokeWidth={1} />
                          <span className="text-[10px] font-black uppercase tracking-widest mt-2">Sem Mídia</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <PlayCircle size={48} className="text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full border-4 border-dashed border-zinc-800 p-20 text-center">
                  <Dumbbell className="mx-auto text-zinc-800 mb-4" size={64} />
                  <p className="font-black uppercase tracking-widest text-zinc-600">Nenhum exercício na biblioteca.</p>
                </div>
              )
            )}
          </div>
        )}
      </main>

      {/* Exercise Modal */}
      {isExerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-zinc-900 border-4 border-black shadow-[16px_16px_0px_0px_rgba(37,99,235,1)] p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-black">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 border-2 border-black">
                  <Dumbbell size={24} className="text-white" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                  {editingExercise?.id ? 'Editar Exercício' : 'Novo Exercício'}
                </h2>
              </div>
              <button 
                onClick={() => setIsExerciseModalOpen(false)}
                className="p-2 hover:bg-zinc-800 border-2 border-transparent hover:border-black transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveExercise} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nome do Exercício</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-black border-2 border-black p-4 font-bold focus:outline-none focus:border-blue-600 transition-all text-sm"
                    value={editingExercise?.name || ''}
                    onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
                    placeholder="Ex: Supino Reto"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Grupo Muscular</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-black border-2 border-black p-4 font-bold focus:outline-none focus:border-blue-600 transition-all text-sm"
                    value={editingExercise?.muscle_group || ''}
                    onChange={(e) => setEditingExercise({ ...editingExercise, muscle_group: e.target.value })}
                    placeholder="Ex: Peito"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Descrição / Instruções</label>
                <textarea 
                  rows={4}
                  className="w-full bg-black border-2 border-black p-4 font-bold focus:outline-none focus:border-blue-600 transition-all text-sm resize-none"
                  value={editingExercise?.description || ''}
                  onChange={(e) => setEditingExercise({ ...editingExercise, description: e.target.value })}
                  placeholder="Instruções de execução, dicas de postura e respiração..."
                />
              </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                    <span>URL do Vídeo/GIF (Demonstração)</span>
                    <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center text-[8px]">
                      <ImageIcon size={10} className="mr-1" />
                      Upload via ImgBB
                    </a>
                  </label>
                  <input 
                    type="url" 
                    className="w-full bg-black border-2 border-black p-4 font-bold focus:outline-none focus:border-blue-600 transition-all text-sm"
                    value={editingExercise?.media_url || ''}
                    onChange={(e) => setEditingExercise({ ...editingExercise, media_url: e.target.value })}
                    placeholder="Cole o link direto aqui (ex: https://i.ibb.co/.../image.gif)"
                  />
                  <p className="text-[9px] text-zinc-600 font-bold uppercase italic">Dica: No ImgBB, use a opção "Links diretos" após o upload.</p>
                </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4 border-t-2 border-black">
                <button 
                  type="button"
                  onClick={() => setIsExerciseModalOpen(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white p-4 font-black uppercase tracking-widest text-xs border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white p-4 font-black uppercase tracking-widest text-xs border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Salvar Exercício</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Diary Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-zinc-900 border-4 border-black shadow-[16px_16px_0px_0px_rgba(37,99,235,1)] p-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-black shrink-0">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  {selectedStudent.avatar_url || getDynamicAvatar(getEffectiveStudent(selectedStudent)) ? (
                    <img src={selectedStudent.avatar_url || getDynamicAvatar(getEffectiveStudent(selectedStudent))!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-900 font-black text-2xl italic">
                      {selectedStudent.full_name?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                    {isBuildingWorkout ? 'Montar Treino' : isViewingWorkouts ? 'Treinos Arquivados' : 'Diário de Treino'}
                  </h2>
                  <p className="text-xs font-bold text-zinc-500 mt-1 uppercase tracking-widest italic">{selectedStudent.full_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!isBuildingWorkout && !isViewingWorkouts && (
                  <button 
                    onClick={handleStudentPreview}
                    className="p-2 bg-zinc-800 text-white hover:bg-white hover:text-black border-2 border-black transition-all flex items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    title="Ver como Aluno"
                  >
                    <Eye size={20} />
                  </button>
                )}
                <button 
                  onClick={() => {
                    setSelectedStudent(null);
                    setIsBuildingWorkout(false);
                    setIsViewingWorkouts(false);
                  }}
                  className="p-2 hover:bg-zinc-800 border-2 border-transparent hover:border-black transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {isBuildingWorkout ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Título do Treino</label>
                      <input 
                        type="text" 
                        value={workoutTitle}
                        onChange={(e) => setWorkoutTitle(e.target.value)}
                        className="w-full bg-black border-2 border-black p-3 font-bold focus:border-blue-600 transition-all text-sm"
                        placeholder="Ex: Treino de Força A"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Divisão</label>
                      <select 
                        value={workoutDivision}
                        onChange={(e) => setWorkoutDivision(e.target.value)}
                        className="w-full bg-black border-2 border-black p-3 font-bold focus:border-blue-600 transition-all text-sm uppercase"
                      >
                        <option>Treino A</option>
                        <option>Treino B</option>
                        <option>Treino C</option>
                        <option>Full Body</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-black p-3 border border-zinc-800">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500">Exercícios ({selectedExercises.length})</h4>
                      <select 
                        className="bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-1 border border-black cursor-pointer"
                        value=""
                        onChange={(e) => {
                          const ex = exercises.find(ex => ex.id === e.target.value);
                          if (ex) handleAddExerciseToWorkout(ex);
                        }}
                      >
                        <option value="" disabled>+ Adicionar</option>
                        {exercises.map(ex => (
                          <option key={ex.id} value={ex.id}>{ex.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      {selectedExercises.map((ex, idx) => (
                        <div key={idx} className="bg-zinc-800/50 p-4 border border-zinc-800 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase italic">{idx + 1}. {ex.name}</span>
                            <button onClick={() => setSelectedExercises(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-400">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                             <input 
                              type="text" 
                              placeholder="Sets" 
                              value={ex.sets} 
                              onChange={(e) => setSelectedExercises(prev => prev.map((item, i) => i === idx ? { ...item, sets: e.target.value } : item))}
                              className="bg-black border border-zinc-700 p-2 text-[10px] font-bold text-center"
                             />
                             <input 
                              type="text" 
                              placeholder="Reps" 
                              value={ex.reps} 
                              onChange={(e) => setSelectedExercises(prev => prev.map((item, i) => i === idx ? { ...item, reps: e.target.value } : item))}
                              className="bg-black border border-zinc-700 p-2 text-[10px] font-bold text-center"
                             />
                             <input 
                              type="text" 
                              placeholder="Peso" 
                              value={ex.weight} 
                              onChange={(e) => setSelectedExercises(prev => prev.map((item, i) => i === idx ? { ...item, weight: e.target.value } : item))}
                              className="bg-black border border-zinc-700 p-2 text-[10px] font-bold text-center underline decoration-blue-500"
                             />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : isViewingWorkouts ? (
                <div className="space-y-4">
                  {studentWorkouts.length > 0 ? (
                    studentWorkouts.map((workout) => (
                      <div key={workout.id} className="bg-black border-2 border-black p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-black uppercase italic leading-none">{workout.name}</h4>
                          <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{workout.division}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditWorkout(workout)}
                            className="px-3 py-1.5 bg-zinc-800 text-white text-[10px] font-black uppercase border border-zinc-700 hover:bg-white hover:text-black transition-all"
                          >
                            <Edit2 size={14} className="inline mr-1" /> Editar
                          </button>
                          <button 
                            onClick={async () => {
                              if(confirm('Excluir este treino?')) {
                                await supabase.from('workouts').delete().eq('id', workout.id);
                                fetchStudentWorkouts(selectedStudent.id);
                              }
                            }}
                            className="px-3 py-1.5 bg-red-900/20 text-red-500 text-[10px] font-black uppercase border border-red-900/40 hover:bg-red-600 hover:text-white transition-all"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center border-2 border-dashed border-zinc-800">
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Nenhum treino arquivado.</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {loadingHistory ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                      <p className="font-black uppercase tracking-widest text-zinc-500">Lendo pergaminhos de treino...</p>
                    </div>
                  ) : studentHistory.length > 0 ? (
                    studentHistory.map((item, idx) => (
                      <div key={idx} className="bg-black border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between hover:border-blue-600 transition-colors group">
                        <div className="flex items-center space-x-6">
                          <div className="bg-zinc-900 w-16 h-16 border-2 border-zinc-800 group-hover:border-blue-600 flex flex-col items-center justify-center transition-colors">
                            <span className="text-[8px] font-black uppercase text-zinc-500">XP</span>
                            <span className="text-xl font-black text-blue-400">+{item.xp_gained}</span>
                          </div>
                          <div>
                            <h4 className="text-lg font-black uppercase tracking-tighter mb-1 italic">Vitoria no Campo de Batalha</h4>
                            <div className="flex items-center text-xs text-zinc-500 space-x-4">
                              <span className="flex items-center"><Calendar size={12} className="mr-1" /> {new Date(item.created_at).toLocaleString('pt-BR')}</span>
                              <span className="bg-blue-600/10 text-blue-400 px-2 py-0.5 border border-blue-600/20 font-black uppercase text-[10px]">Quest Concluída</span>
                            </div>
                          </div>
                        </div>
                        <TrendingUp className="text-zinc-800 group-hover:text-blue-600 transition-colors" size={32} />
                      </div>
                    ))
                  ) : (
                    <div className="border-4 border-dashed border-zinc-800 p-20 text-center">
                      <History className="mx-auto text-zinc-800 mb-4" size={48} />
                      <p className="font-black uppercase tracking-widest text-zinc-600">Este aluno ainda não iniciou sua jornada.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pt-6 border-t-2 border-black mt-6 shrink-0 space-y-4">
              {!isBuildingWorkout && !isViewingWorkouts ? (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      setIsBuildingWorkout(true);
                      setWorkoutTitle('');
                      setSelectedExercises([]);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white p-4 font-black uppercase tracking-widest text-xs border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Montar Treino
                  </button>
                  <button 
                    onClick={() => setIsViewingWorkouts(true)}
                    className="flex-1 bg-white hover:bg-zinc-100 text-black p-4 font-black uppercase tracking-widest text-xs border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2"
                  >
                    <LayoutList size={16} />
                    Ver Treinos
                  </button>
                </div>
              ) : isBuildingWorkout ? (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      setIsBuildingWorkout(false);
                      setEditingWorkoutId(null);
                    }}
                    className="flex-1 bg-zinc-800 text-white p-4 font-black uppercase tracking-widest text-xs border-2 border-black transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveWorkout}
                    disabled={isSavingWorkout}
                    className="flex-1 bg-lime-500 hover:bg-lime-400 text-black p-4 font-black uppercase tracking-widest text-xs border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSavingWorkout ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Salvar Treino
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsViewingWorkouts(false)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white p-4 font-black uppercase tracking-widest text-xs border-2 border-black transition-all"
                >
                   Voltar ao Diário
                </button>
              )}
               <button 
                onClick={() => {
                  setSelectedStudent(null);
                  setIsBuildingWorkout(false);
                  setIsViewingWorkouts(false);
                }}
                className="w-full bg-black text-zinc-500 p-2 font-black uppercase tracking-widest text-[8px] hover:text-white transition-all"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
