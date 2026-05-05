import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Profile, UserRole } from '../types';
import { 
  Users, 
  ShieldCheck, 
  Mail, 
  Calendar, 
  UserPlus, 
  GraduationCap, 
  LogOut, 
  ArrowLeft, 
  Loader2, 
  Search, 
  Crown,
  Sword,
  ShieldAlert,
  ArrowUpCircle,
  Trophy,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { getDynamicAvatar } from '../lib/avatarLibrary';

type FilterType = 'all' | 'pending' | 'aluno' | 'professor' | 'admin';

export const ManageRegistrationsPage = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const lastUpdateRef = React.useRef<number>(0);
  
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    // Verificamos o cargo diretamente no perfil
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Permite se for o email específico ou se tiver role admin
    const isMasterAdmin = user.email === 'lucas.cadoso@gmail.com' || user.email === 'lucas.workcardosov@gmail.com';
    if (error || (profile?.role !== 'admin' && !isMasterAdmin)) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    setCurrentUserEmail(user.email);
    fetchAllUsers();
  };
  const fetchAllUsers = async (silent = false) => {
    // Priority: Never refresh if an update happened in the last 30 seconds
    const now = Date.now();
    if (silent && (now - lastUpdateRef.current < 30000)) {
      console.log('[ManageRegistrations] Refetch skipped due to recent update (30s cooldown)');
      return;
    }

    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .setHeader('Cache-Control', 'no-cache') // Force bypass any browser/Supabase caching
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    const targetRole = role.toLowerCase() as UserRole;
    console.log(`[ManageRegistrations] Attempting to update role for user ${userId} to ${targetRole}`);
    setProcessingId(userId);
    
    // Determine class based on role/approval
    let userClass = 'pendente';
    if (targetRole === 'aluno') userClass = 'Guerreiro';
    else if (targetRole === 'professor') userClass = 'Mestre';
    else if (targetRole === 'admin') userClass = 'Arquimago';

    try {
      // Check if we are updating the current logged-in user to sync metadata
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const isSelfUpdate = authUser?.id === userId;

      // 1. Update Profile Table (Definitive storage)
      const { data, error, status } = await supabase
        .from('profiles')
        .update({ 
          role: targetRole,
          class: userClass
        })
        .eq('id', userId)
        .select('id, role, class');

      if (error) {
        console.error('Supabase update error:', error);
        alert(`Erro ao atualizar perfil no banco: ${error.message}`);
        await fetchAllUsers(true);
        return;
      }

      // 2. Sincronização Dupla: Update auth metadata if it's the same user
      if (isSelfUpdate) {
        console.log('[ManageRegistrations] Syncing auth metadata for current user...');
        await supabase.auth.updateUser({
          data: { role: targetRole, class: userClass }
        });
        
        // 3. Forçar Refresh de Sessão IMEDIATO: Isso garante que o JWT tenha o novo cargo
        console.log('[ManageRegistrations] Forcing session refresh to update JWT...');
        await supabase.auth.refreshSession();
      }
      
      // 4. Update local state ONLY after success (204/200)
      if (status === 204 || status === 200) {
        lastUpdateRef.current = Date.now();
        const dbReturn = data && data.length > 0 ? data[0] : null;

        // Strict verification: If select() returned nothing, we might have a RLS/Consistency issue
        if (!dbReturn) {
          console.error('[ManageRegistrations] Update status was success but no data returned. Possible RLS issue.');
          alert('Aviso: O banco confirmou a alteração mas não devolveu os dados. Verificando integridade...');
          await fetchAllUsers(true);
          return;
        }

        const confirmedRole = dbReturn.role.toLowerCase() as UserRole;
        const confirmedClass = dbReturn.class;

        // Double verification of values
        if (confirmedRole !== targetRole) {
          alert(`Erro de Sincronização: O banco retornou cargo "${confirmedRole}" em vez de "${targetRole}".`);
          await fetchAllUsers(true);
          return;
        }

        setUsers(prev => prev.map(u => 
          u.id === userId 
            ? { ...u, role: confirmedRole, class: confirmedClass } 
            : u
        ));
        
        console.log(`[ManageRegistrations] User ${userId} successfully updated and synced as: ${confirmedRole}`);
        
        // Critical: Invalidate local caches and clear list buffers
        localStorage.removeItem('leveling_user_profile');
        localStorage.removeItem('leveling_users_list');
        sessionStorage.clear(); 
      }
      
    } catch (error: any) {
      console.error('Fatal error in handleUpdateRole:', error);
      alert(`Erro fatal: ${error.message}`);
      await fetchAllUsers(true);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateLevel = async (user: Profile) => {
    setProcessingId(user.id);
    const nextLevel = (user.level || 1) + 1;
    try {
      // 1. Update Profile Level
      const { error: levelError } = await supabase
        .from('profiles')
        .update({ level: nextLevel })
        .eq('id', user.id);
      
      if (levelError) throw levelError;

      // 2. Search for new avatar in library
      // Wrap in inner try-catch to prevent crashing the whole process
      try {
        const userClass = user.class || 'Guerreiro';
        const userGender = user.gender || 'M';

        // Fetching without 'class' filter to avoid potential missing column errors in Supabase
        // We select only needed columns to be safe
        const { data: avatars, error: avatarError } = await supabase
          .from('avatar_library')
          .select('id, image_url, min_level')
          .eq('gender', userGender)
          .lte('min_level', nextLevel)
          .order('min_level', { ascending: false });

        if (!avatarError && avatars && avatars.length > 0) {
          // If the DB doesn't have the class column, we just pick the highest level match
          // or we can try to filter locally if the data actually returned a class property
          const match = avatars.find(a => {
            const avatarClass = (a as any).class || (a as any).category || '';
            return avatarClass.toString().toLowerCase() === userClass.toLowerCase();
          }) || avatars[0];
          
          await supabase
            .from('profiles')
            .update({ 
              avatar_url: match.image_url,
              current_avatar_id: match.id
            })
            .eq('id', user.id);
        }
      } catch (avatarSyncErr) {
        console.warn('[ManageRegistrations] Skipping avatar sync due to error:', avatarSyncErr);
      }

      // Local update to avoid full refresh flickering
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, level: nextLevel } : u
      ));

    } catch (error) {
      console.error('Error updating level:', error);
      alert('Erro ao subir nível.');
      await fetchAllUsers(true);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignInstructor = async (studentId: string, instructorId: string) => {
    setProcessingId(studentId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ instructor_id: instructorId || null })
        .eq('id', studentId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === studentId ? { ...u, instructor_id: instructorId } : u
      ));
      
      console.log(`[ManageRegistrations] User ${studentId} assigned to instructor ${instructorId}`);
      setAssignmentId(null);
    } catch (error: any) {
      console.error('Error assigning instructor:', error);
      alert(`Erro ao designar mestre: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    const userClass = user.class?.toLowerCase();
    const userRole = user.role?.toLowerCase();

    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return userRole === 'pendente';
    if (activeFilter === 'aluno') return userRole === 'aluno';
    if (activeFilter === 'professor') return userRole === 'professor';
    if (activeFilter === 'admin') return userRole === 'admin';
    
    return true;
  });

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('DESEJA REALMENTE RECUSAR E EXCLUIR ESTE PERFIL? ESTA AÇÃO É IRREVERSÍVEL.')) return;
    setProcessingId(userId);
    try {
      // Note: This only deletes the profile. Auth deletion requires Admin SDK or a specific edge function.
      // But for the sake of the request "Recusar", we'll remove them from the list.
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert('Perfil recusado e removido do sistema.');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(`Erro ao recusar usuário: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleTag = (user: Profile) => {
    const role = user.role?.toLowerCase();
    
    // Admin / Arquimago
    if (role === 'admin') {
      return <span className="bg-amber-400 text-black border-2 border-black px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(251,191,36,0.3)] italic">ARQUIMAGO</span>;
    }
    
    // Professor / Mestre
    if (role === 'professor') {
      return <span className="bg-blue-600 text-white border-2 border-black px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(37,99,235,0.3)] italic">MESTRE</span>;
    }
    
    // Aluno / Guerreiro
    if (role === 'aluno') {
      return <span className="bg-zinc-600 text-white border-2 border-black px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] italic">GUERREIRO</span>;
    }
    
    // Everything else is Pendente/Player
    return <span className="bg-lime-400 text-black border-2 border-black px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(163,230,53,0.3)] italic">PENDENTE</span>;
  };

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="bg-white border-4 border-black p-8 max-w-md w-full shadow-[16px_16px_0px_0px_rgba(239,68,68,1)] text-center">
          <ShieldAlert size={64} className="mx-auto text-red-600 mb-6" />
          <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Acesso Negado</h1>
          <p className="text-zinc-600 font-bold mb-8 italic">Você não tem permissão para acessar esta área restrita do Ecossistema Leveling.</p>
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            Voltar para o Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans p-6 md:p-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div className="flex items-center space-x-4">
          <div className="bg-lime-400 p-2 border-2 border-black rotate-[-3deg] shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <Crown className="text-black" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Central de <span className="text-lime-400">Comando</span></h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Gestão de Hierarquia da Guilda</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => navigate('/admin')} 
            variant="outline" 
            disabled={!!processingId}
            className="border-zinc-800 text-zinc-400 hover:text-white text-xs disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={18} className="mr-2" /> Painel Geral
          </Button>
          <Button 
            onClick={() => supabase.auth.signOut().then(() => navigate('/login'))} 
            variant="ghost" 
            disabled={!!processingId}
            className="text-zinc-500 hover:text-red-400 text-xs uppercase font-black disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <LogOut size={18} className="mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-12 lg:col-span-5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">Localizar Combatente</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="text" 
                placeholder="E-mail ou nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border-2 border-black p-4 pl-12 text-sm font-black uppercase placeholder:text-zinc-800 italic focus:border-lime-400 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="md:col-span-12 lg:col-span-7 flex flex-wrap gap-2">
            {(['all', 'pending', 'aluno', 'professor', 'admin'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none ${
                  activeFilter === filter 
                    ? 'bg-lime-400 text-black translate-x-0.5 translate-y-0.5 shadow-none' 
                    : 'bg-zinc-900 text-zinc-500 hover:text-white border-zinc-800'
                }`}
              >
                {filter === 'all' && 'Todos'}
                {filter === 'pending' && 'Pendentes'}
                {filter === 'aluno' && 'Guerreiros'}
                {filter === 'professor' && 'Mestres'}
                {filter === 'admin' && 'Arquimagos'}
              </button>
            ))}
          </div>
        </div>

        {/* User List */}
        <div className="bg-zinc-900 border-4 border-black overflow-hidden shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
          <div className="p-6 bg-black border-b-4 border-black flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Users className="text-lime-400" size={20} />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                Membros Conectados ({filteredUsers.length})
              </h3>
            </div>
          </div>
          
          <div className="divide-y-4 divide-black">
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-lime-400 mb-4" size={48} />
                <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Sincronizando Banco de Dados...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <motion.div 
                  key={user.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white border-2 border-black flex flex-shrink-0 items-center justify-center font-black text-black italic text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                        {((user.avatar_url && !user.avatar_url.includes('mage-low-m.jpg')) || getDynamicAvatar(user)) ? (
                          <img 
                            src={user.avatar_url || getDynamicAvatar(user)!} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              // If image fails, use UI Avatar or a default placeholder
                              (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email)}&background=000&color=fff&bold=true`;
                            }}
                          />
                        ) : (
                          user.role?.toLowerCase() === 'professor' ? (
                            <GraduationCap size={24} className="text-blue-600" />
                          ) : (
                            user.email.substring(0, 2).toUpperCase()
                          )
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <h4 className="text-xl font-black uppercase italic truncate max-w-[200px] sm:max-w-none">
                            {user.full_name || 'Guerreiro Sem Nome'}
                          </h4>
                          {getRoleTag(user)}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate">
                          {user.email}
                        </p>
                        {user.instructor_id && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic">Mentor:</span>
                            <span className="text-[10px] font-bold text-zinc-400">
                              {users.find(u => u.id === user.instructor_id)?.full_name || 'Mestre Desconhecido'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 self-end md:self-center">
                    {user.role?.toLowerCase() === 'aluno' && (
                      <div className="relative">
                        <button
                          onClick={() => setAssignmentId(assignmentId === user.id ? null : user.id)}
                          disabled={processingId === user.id}
                          className="px-4 py-3 border-2 border-black bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white hover:bg-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          <UserCheck size={16} />
                          Designar Mestre
                          <ChevronDown size={14} className={`transition-transform ${assignmentId === user.id ? 'rotate-180' : ''}`} />
                        </button>

                        {assignmentId === user.id && (
                          <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50 py-2">
                             <div className="px-3 pb-2 border-b border-zinc-800 mb-2">
                               <p className="text-[9px] font-black uppercase text-zinc-500 tracking-tighter">Escolha um Mestre</p>
                             </div>
                             <div className="max-h-48 overflow-y-auto">
                               <button
                                 onClick={() => handleAssignInstructor(user.id, '')}
                                 className="w-full text-left px-4 py-2 text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-colors"
                               >
                                 Remover Mentor
                               </button>
                               {users.filter(u => u.role === 'professor').map(prof => (
                                 <button
                                   key={prof.id}
                                   onClick={() => handleAssignInstructor(user.id, prof.id)}
                                   className={`w-full text-left px-4 py-2 text-[10px] font-black uppercase transition-colors ${user.instructor_id === prof.id ? 'bg-blue-600 text-white' : 'hover:bg-zinc-800'}`}
                                 >
                                   {prof.full_name || prof.email}
                                 </button>
                               ))}
                               {users.filter(u => u.role === 'professor').length === 0 && (
                                 <p className="px-4 py-2 text-[10px] font-bold text-zinc-600 italic">Nenhum Mestre disponível.</p>
                               )}
                             </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="hidden lg:block text-right mr-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Inscrito em</p>
                      <p className="text-[11px] font-black text-zinc-400">{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {user.role?.toLowerCase() === 'pendente' ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpdateRole(user.id, 'aluno')}
                            disabled={processingId === user.id}
                            className="px-4 py-3 border-2 border-black bg-lime-500 text-black font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2"
                          >
                            {processingId === user.id ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                            Aprovar
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={processingId === user.id}
                            className="px-4 py-3 border-2 border-black bg-zinc-800 text-red-500 font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2"
                          >
                            Recusar
                          </button>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleUpdateLevel(user)}
                            disabled={processingId === user.id}
                            className="p-3 border-2 border-black bg-lime-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 flex items-center gap-2"
                            title="Subir Nível"
                          >
                            {processingId === user.id ? <Loader2 size={18} className="animate-spin" /> : (
                              <>
                                <Trophy size={18} />
                                <span className="text-[10px] font-black italic">NV {user.level || 1}</span>
                              </>
                            )}
                          </button>

                          <div className="w-[2px] h-8 bg-zinc-800 mx-1"></div>

                          <button 
                            onClick={() => handleUpdateRole(user.id, 'aluno')}
                            disabled={processingId === user.id}
                            className={`p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(163,230,53,0.3)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 ${user.role?.toLowerCase() === 'aluno' ? 'bg-lime-400 text-black ring-4 ring-lime-400/50 scale-105 shadow-[0_0_25px_rgba(163,230,53,0.7)]' : 'bg-black text-zinc-700 border-zinc-900'}`}
                            title="Tornar Guerreiro"
                          >
                            {processingId === user.id ? <Loader2 size={18} className="animate-spin" /> : <Sword size={18} className={user.role?.toLowerCase() === 'aluno' ? 'animate-pulse' : ''} />}
                          </button>
                          
                          <button 
                            onClick={() => handleUpdateRole(user.id, 'professor')}
                            disabled={processingId === user.id}
                            className={`p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(37,99,235,0.3)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 ${user.role?.toLowerCase() === 'professor' ? 'bg-blue-600 text-white font-black ring-4 ring-blue-500/50 scale-105 shadow-[0_0_25px_rgba(37,99,235,0.7)] opacity-100' : 'bg-black text-zinc-700 border-zinc-900 opacity-60'}`}
                            title="Tornar Mestre"
                          >
                            {processingId === user.id ? <Loader2 size={18} className="animate-spin" /> : <GraduationCap size={18} className={user.role?.toLowerCase() === 'professor' ? 'animate-pulse' : ''} />}
                          </button>
                          
                          <button 
                            onClick={() => handleUpdateRole(user.id, 'admin')}
                            disabled={processingId === user.id}
                            className={`p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(251,191,36,0.3)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 ${user.role?.toLowerCase() === 'admin' ? 'bg-amber-400 text-black ring-4 ring-amber-400/50 scale-105 shadow-[0_0_25px_rgba(251,191,36,0.7)]' : 'bg-black text-zinc-700 border-zinc-900'}`}
                            title="Tornar Arquimago"
                          >
                            {processingId === user.id ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} className={user.role?.toLowerCase() === 'admin' ? 'animate-pulse' : ''} />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-20 text-center text-zinc-600 flex flex-col items-center">
                <Search size={64} className="mb-6 opacity-10" />
                <h3 className="font-black uppercase italic tracking-tighter text-2xl mb-2">Sem Resultados</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-700">Nenhum combatente encontrado com os critérios de busca.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-8 bg-black border-4 border-black border-dashed opacity-60 flex items-start space-x-6">
          <div className="bg-lime-400 p-3 border-2 border-black text-black">
            <UserPlus size={24} />
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-2 italic">Acesso Restrito</h4>
            <p className="text-[10px] font-mono text-zinc-400 leading-relaxed max-w-3xl">
              Você está na Central de Comando. O controle de cargos é síncrono e afeta todas as camadas de segurança (RLS) do Supabase. 
              Guerreiros podem treinar, Mestres podem ensinar e Arquimagos podem governar. 
              Sessão ativa: <span className="text-lime-400 underline">{currentUserEmail}</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
