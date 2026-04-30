import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dumbbell, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Logic for redirection
      if (email === 'lucas.cadoso@gmail.com') {
        navigate('/admin');
        return;
      }

      // Fetch profile to check status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status, role')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role === 'admin') {
        navigate('/admin');
      } else if (profile.status === 'pending') {
        navigate('/pending');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar email de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md w-full"
      >
        <div className="flex justify-center mb-8">
          <div className="bg-lime-400 p-4 border-4 border-black rotate-3">
            <Dumbbell size={40} className="text-black" />
          </div>
        </div>

        <div className="bg-zinc-900 border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(163,230,53,1)]">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic mb-2">
            Workout <span className="text-lime-400">Login</span>
          </h1>
          <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest mb-8">
            Entre na sua jornada fitness
          </p>

          {error && (
            <div className="mb-6 p-4 border-2 border-red-500 bg-red-500/10 text-red-500 font-bold uppercase text-xs flex items-center">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {!showForgot ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleLogin} 
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full h-12 bg-zinc-800 border-2 border-black px-12 text-white font-medium focus:ring-2 focus:ring-lime-400 outline-none transition-all placeholder:text-zinc-600"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Sua senha"
                      className="w-full h-12 bg-zinc-800 border-2 border-black px-12 text-white font-medium focus:ring-2 focus:ring-lime-400 outline-none transition-all placeholder:text-zinc-600"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-lime-400 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <Button type="submit" isLoading={loading} variant="secondary" className="w-full py-4 text-lg">
                  Entrar no Portal <ArrowRight className="ml-2" />
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="forgot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {!resetSent ? (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <p className="text-zinc-400 text-sm font-medium">
                      Insira seu e-mail para enviarmos um link de redefinição de senha.
                    </p>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full h-12 bg-zinc-800 border-2 border-black px-12 text-white font-medium focus:ring-2 focus:ring-lime-400 outline-none transition-all placeholder:text-zinc-600"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Button type="button" onClick={() => setShowForgot(false)} variant="outline" className="border-zinc-700 text-zinc-400 hover:text-white">
                        Voltar
                      </Button>
                      <Button type="submit" isLoading={loading} variant="secondary">
                        Enviar Link
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <div className="inline-flex p-3 bg-lime-400/20 border-2 border-lime-400 rounded-full mb-4">
                      <Mail className="text-lime-400" />
                    </div>
                    <h3 className="text-white text-xl font-black uppercase italic mb-2">E-mail Enviado!</h3>
                    <p className="text-zinc-400 text-sm mb-6">Verifique sua caixa de entrada para continuar.</p>
                    <Button onClick={() => setShowForgot(false)} variant="outline" className="w-full border-zinc-700 text-zinc-400">
                      Voltar ao Login
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center">
          <Link to="/register" className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-lime-400 transition-colors underline">
            Não tem uma conta? Cadastre-se
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
