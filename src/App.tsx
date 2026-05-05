import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, getSupabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Profile } from './types';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Dashboard } from './pages/Dashboard';
import { AdminPage } from './pages/AdminPage';
import { ManageRegistrationsPage } from './pages/ManageRegistrationsPage';
import { AdminAvatarsPage } from './pages/AdminAvatarsPage';
import { PendingApprovalPage } from './pages/PendingApprovalPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import { WorkoutPage } from './pages/WorkoutPage';
import { ProgressPage } from './pages/ProgressPage';
import { ExerciseDetail } from './pages/ExerciseDetail';
import { ProfilePage } from './pages/ProfilePage';
import { ProfessorDashboard } from './pages/ProfessorDashboard';
import { Button } from './components/ui/Button';
import { Settings, AlertTriangle } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    try {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      const client = getSupabase();

      // Get initial session
      client.auth.getSession().then(({ data: { session }, error }) => {
        if (!mounted) return;
        
        if (error) {
          console.error('Session get error:', error);
          // If refresh token is invalid or missing, clear everything and go to login
          if (
            error.message.includes('Refresh Token Not Found') || 
            error.message.includes('invalid_grant') ||
            error.message.includes('refresh_token_not_found') ||
            error.status === 400 ||
            error.status === 401
          ) {
            client.auth.signOut().catch(() => {});
            localStorage.clear(); // Nuclear option to clear corrupted session data
            setSession(null);
            setLoading(false);
            return;
          }
          throw error;
        }

        setSession(session);
        if (!session) {
          setLoading(false);
        }
      }).catch(err => {
        if (!mounted) return;
        console.error('Session fetch error:', err);
        
        // Se for qualquer erro de autenticação/token, resetamos para permitir novo login
        if (err.message && (
          err.message.includes('Refresh Token Not Found') || 
          err.message.includes('refresh_token_not_found') ||
          err.message.includes('invalid_grant') ||
          err.message.includes('session_not_found')
        )) {
          client.auth.signOut().catch(() => {});
          localStorage.clear();
          setSession(null);
        } else {
          setInitError('Houve um problema com sua sessão. Por favor, tente sair e entrar novamente.');
        }
        setLoading(false);
      });

      // Listen for auth changes
      const { data: { subscription } } = client.auth.onAuthStateChange((event, newSession) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_IN') {
          setSession(newSession);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setProfile(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          setSession(newSession);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } catch (error: any) {
      console.error('App init error:', error);
      setInitError(error.message || 'Falha crítica na inicialização.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 5-second Fallback: If still loading after 5s, check session/profile and stop loading
    // to prevent infinite loop of "Loading Profile..."
    const timeout = setTimeout(() => {
      if (loading && session) {
        console.warn('[App] Profile fetch timeout reached. Checking state...');
        if (!profile) {
          // If we have a session but NO profile after 5s, we might need a fresh start or it's a new user
          setInitError('O tempo de carregamento do perfil expirou. Verifique sua conexão ou tente reentrar.');
        }
        setLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [loading, session, profile]);

  useEffect(() => {
    let profileSubscription: any = null;

    if (session?.user?.id) {
      fetchProfile(session.user.id);

      // Real-time listener for profile changes (crucial for "Pendente" -> "Aprovado" transition)
      profileSubscription = getSupabase()
        .channel(`profile:${session.user.id}`)
        .on(
          'postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles', 
            filter: `id=eq.${session.user.id}` 
          }, 
          (payload) => {
            console.log('[App] Profile update detected via real-time:', payload.new);
            setProfile(payload.new as Profile);
          }
        )
        .subscribe();
    } else {
      setProfile(null);
    }

    return () => {
      if (profileSubscription) getSupabase().removeChannel(profileSubscription);
    };
  }, [session]);

  const fetchProfile = async (userId: string) => {
    try {
      // Prioritize auth.getUser() metadata for role stability as requested
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .setHeader('Cache-Control', 'no-cache')
        .setHeader('Pragma', 'no-cache')
        .maybeSingle();

      if (error) {
        // Handle 42P17 (infinite recursion/infinite loop)
        if (error.code === '42P17' || error.message.includes('recursion')) {
          console.error('[App] Infinite recursion detected in RLS policies.');
          
          // Use auth metadata as safe fallback to prevent rendering crash
          if (user?.user_metadata) {
            setProfile({
              id: userId,
              email: user.email || '',
              role: user.user_metadata.role || 'aluno',
              class: user.user_metadata.class || 'Guerreiro',
              full_name: user.user_metadata.full_name || '',
              nickname: user.user_metadata.nickname || '',
              avatar_url: user.user_metadata.avatar_url || null,
              created_at: user.created_at
            } as Profile);
            setLoading(false);
            return;
          }

          // If no metadata available, reset session to allow fresh start
          setInitError('Erro de Recursão no Banco. Limpando sessão para segurança.');
          await supabase.auth.signOut();
          localStorage.clear();
          return;
        }

        // Se for erro de autenticação (JWT expirado ou algo assim que não foi pego pelo getSession)
        if (error.code === 'PGRST301' || error.message.includes('JWT')) {
          console.error('Auth error during profile fetch:', error);
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        throw error;
      }
      if (!data) {
        // Tolerant check: If profile is missing, it might still be generating after registration
        console.warn(`[App] Profile not found for user ${userId}. Retrying or waiting...`);
        
        // Use auth metadata as fallback if available
        if (user?.user_metadata) {
          setProfile({
            id: userId,
            email: user.email || '',
            role: user.user_metadata.role || 'aluno',
            class: user.user_metadata.class || 'Guerreiro',
            full_name: user.user_metadata.full_name || '',
            nickname: user.user_metadata.nickname || '',
            avatar_url: user.user_metadata.avatar_url || null,
            created_at: user.created_at
          } as Profile);
        }
        return;
      }

      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setInitError(error.message || 'Erro ao carregar seu perfil. O registro pode estar incompleto.');
    } finally {
      setLoading(false);
    }
  };

  if (initError) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white border-4 border-black p-8 shadow-[16px_16px_0px_0px_rgba(239,68,68,1)]">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 italic text-red-600">Erro de Inicialização</h2>
          <p className="font-medium text-zinc-600 mb-6 text-sm">{initError}</p>
          <div className="space-y-4">
            <Button 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                // Clear any supabase storage specifically if possible via their library, 
                // but localStorage.clear() is usually enough.
                window.location.reload();
              }} 
              variant="outline" 
              className="w-full"
            >
              Tentar Novamente
            </Button>
            <button 
              onClick={async () => {
                console.log('[App] Forced session reset triggered...');
                localStorage.clear();
                sessionStorage.clear();
                
                // Clear any potential cookies or IndexedDB if possible (basic approach)
                try {
                  const dbs = await window.indexedDB.databases();
                  dbs.forEach(db => { if (db.name) window.indexedDB.deleteDatabase(db.name); });
                } catch (e) {}

                await supabase.auth.signOut().catch(() => {});
                
                setSession(null);
                setProfile(null);
                setInitError(null);
                window.location.href = '/login';
              }}
              className="w-full text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
            >
              Forçar Sair da Sessão
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 space-y-8">
        <div className="h-12 w-12 border-4 border-black border-t-lime-400 rounded-full animate-spin" />
        <button 
          onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
          className="text-xs font-black uppercase tracking-widest text-zinc-400 border-2 border-zinc-200 px-4 py-2 hover:bg-black hover:text-white hover:border-black transition-all"
        >
          Sair da Sessão (Reset)
        </button>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] text-center">
        <div className="max-w-xl w-full bg-white border-4 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
          <div className="inline-flex p-4 bg-red-500 border-2 border-black mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <AlertTriangle size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-6">
            Erro: <span className="text-red-600 underline">Ambiente Vercel</span>
          </h1>
          <div className="space-y-4 text-left font-medium text-zinc-600 mb-8 border-l-4 border-red-500 pl-6">
            <p className="font-bold text-red-600">As chaves de API do Supabase não foram encontradas.</p>
            <p>Para corrigir este erro no seu deploy:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm italic font-bold">
              <li>Acesse o painel da <span className="bg-zinc-100 px-1 border border-black text-xs">Vercel</span>.</li>
              <li>Vá em <span className="bg-zinc-100 px-1 border border-black text-xs">Settings &gt; Environment Variables</span>.</li>
              <li>Adicione estas duas chaves EXATAMENTE assim:</li>
            </ol>
            <div className="bg-zinc-900 text-zinc-300 p-4 font-mono text-[11px] space-y-2 mt-4 border-2 border-black">
              <p className="text-lime-400 font-bold select-all">VITE_SUPABASE_URL</p>
              <p className="text-lime-400 font-bold select-all">VITE_SUPABASE_ANON_KEY</p>
            </div>
            <p className="text-xs mt-4">Após adicionar, você precisa fazer um <span className="underline">Redeploy</span> para as mudanças surtirem efeito.</p>
          </div>
          <p className="text-xs text-zinc-400 font-bold uppercase mb-8">Após adicionar, reinicie o servidor ou aguarde a atualização.</p>
          <div className="p-4 bg-amber-50 border-2 border-amber-200 text-amber-700 flex items-start text-xs text-left">
            <AlertTriangle className="mr-3 shrink-0" size={16} />
            <p>Certifique-se de ter executado o SQL de criação das tabelas fornecido anteriormente no Editor SQL do Supabase.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <LoginPage /> : <AuthRedirect session={session} profile={profile} />} />
        <Route path="/register" element={!session ? <RegisterPage /> : <AuthRedirect session={session} profile={profile} />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute session={session} profile={profile}>
            <Dashboard profile={profile!} onRefresh={() => fetchProfile(session!.user.id)} />
          </ProtectedRoute>
        } />

        <Route path="/workout" element={
          <ProtectedRoute session={session} profile={profile}>
            <WorkoutPage profile={profile!} />
          </ProtectedRoute>
        } />

        <Route path="/progress" element={
          <ProtectedRoute session={session} profile={profile}>
            <ProgressPage profile={profile!} />
          </ProtectedRoute>
        } />

        <Route path="/exercise/:id" element={
          <ProtectedRoute session={session} profile={profile}>
            <ExerciseDetail profile={profile!} />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute session={session} profile={profile}>
            <ProfilePage profile={profile!} onRefresh={() => fetchProfile(session!.user.id)} />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute session={session} profile={profile} requiredRole="admin">
            <AdminPage />
          </ProtectedRoute>
        } />

        <Route path="/admin/registrations" element={
          <ProtectedRoute session={session} profile={profile} requiredRole="admin">
            <ManageRegistrationsPage />
          </ProtectedRoute>
        } />

        <Route path="/admin/avatars" element={
          <ProtectedRoute session={session} profile={profile} requiredRole="admin">
            <AdminAvatarsPage />
          </ProtectedRoute>
        } />

        <Route path="/professor/dashboard" element={
          <ProtectedRoute session={session} profile={profile} requiredRole="professor">
            <ProfessorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/pending-approval" element={
          session ? (
            profile && profile.role !== 'pendente' ? (
              <AuthRedirect session={session} profile={profile} />
            ) : (
              <PendingApprovalPage />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Redirect logic after login/already authenticated
function AuthRedirect({ session, profile }: { session: Session; profile: Profile | null }) {
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><div className="h-12 w-12 border-4 border-black border-t-lime-400 rounded-full animate-spin" /></div>;
  
  const isMasterAdmin = profile.email === 'lucas.cadoso@gmail.com' || profile.email === 'lucas.workcardosov@gmail.com';
  if (profile.role === 'admin' || isMasterAdmin) return <Navigate to="/admin" replace />;
  if (profile.role === 'professor') return <Navigate to="/professor/dashboard" replace />;
  if (profile.role === 'pendente') return <Navigate to="/pending-approval" replace />;
  return <Navigate to="/dashboard" replace />;
}

// Helper to protect routes
function ProtectedRoute({ 
  children, 
  session, 
  profile, 
  requiredRole 
}: { 
  children: React.ReactNode; 
  session: Session | null; 
  profile: Profile | null;
  requiredRole?: string;
}) {
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><div className="h-12 w-12 border-4 border-black border-t-lime-400 rounded-full animate-spin" /></div>;

  // Admins or Master Emails bypass all restrictions
  const isMasterAdmin = profile.email === 'lucas.cadoso@gmail.com' || profile.email === 'lucas.workcardosov@gmail.com';
  if (profile.role === 'admin' || isMasterAdmin) return <>{children}</>;

  // Se está pendente, manda para espera
  if (profile.role === 'pendente') return <Navigate to="/pending-approval" replace />;

  if (requiredRole && profile.role !== requiredRole) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}
