import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, getSupabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Profile } from './types';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Dashboard } from './pages/Dashboard';
import { PendingPage } from './pages/PendingPage';
import { AdminPage } from './pages/AdminPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import { Button } from './components/ui/Button';
import { Settings, AlertTriangle } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      const client = getSupabase();

      client.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) fetchProfile(session.user.id);
        else setLoading(false);
      }).catch(err => {
        console.error('Session fetch error:', err);
        setInitError('Erro ao conectar com o servidor de autenticação.');
        setLoading(false);
      });

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session) fetchProfile(session.user.id);
        else {
          setProfile(null);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } catch (error: any) {
      console.error('App init error:', error);
      setInitError(error.message || 'Falha crítica na inicialização.');
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (initError) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(239,68,68,1)]">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 italic text-red-600">Erro de Inicialização</h2>
          <p className="font-medium text-zinc-600 mb-6">{initError}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="h-12 w-12 border-4 border-black border-t-lime-400 rounded-full animate-spin" />
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
          <ProtectedRoute session={session} profile={profile} requiredStatus="approved">
            <Dashboard profile={profile!} onRefresh={() => fetchProfile(session!.user.id)} />
          </ProtectedRoute>
        } />
        
        <Route path="/pending" element={
          <ProtectedRoute session={session} profile={profile} requiredStatus="pending">
            <PendingPage />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute session={session} profile={profile} requiredRole="admin">
            <AdminPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Redirect logic after login/already authenticated
function AuthRedirect({ session, profile }: { session: Session; profile: Profile | null }) {
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><div className="h-12 w-12 border-4 border-black border-t-lime-400 rounded-full animate-spin" /></div>;
  
  if (session.user.email === 'lucas.cadoso@gmail.com' || profile.role === 'admin') return <Navigate to="/admin" replace />;
  if (profile.status === 'pending') return <Navigate to="/pending" replace />;
  return <Navigate to="/dashboard" replace />;
}

// Helper to protect routes
function ProtectedRoute({ 
  children, 
  session, 
  profile, 
  requiredStatus, 
  requiredRole 
}: { 
  children: React.ReactNode; 
  session: Session | null; 
  profile: Profile | null;
  requiredStatus?: string;
  requiredRole?: string;
}) {
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><div className="h-12 w-12 border-4 border-black border-t-lime-400 rounded-full animate-spin" /></div>;

  if (requiredRole && profile.role !== requiredRole && session.user.email !== 'lucas.cadoso@gmail.com') return <Navigate to="/login" replace />;
  if (requiredStatus && profile.status !== requiredStatus && profile.role !== 'admin') {
    if (profile.status === 'pending') return <Navigate to="/pending" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
