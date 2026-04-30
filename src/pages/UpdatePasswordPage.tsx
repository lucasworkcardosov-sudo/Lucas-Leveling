import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const UpdatePasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;
      setSuccess(true);
      // Redireciona para o dashboard após sucesso
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-zinc-900 border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(163,230,53,1)]"
      >
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic mb-2">
          Nova <span className="text-lime-400">Senha</span>
        </h1>
        <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest mb-8">
          Redefina sua chave de acesso
        </p>

        {error && (
          <div className="mb-6 p-4 border-2 border-red-500 bg-red-500/10 text-red-500 font-bold uppercase text-xs flex items-center">
            <AlertCircle size={16} className="mr-2" />
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-6">
            <CheckCircle size={64} className="mx-auto text-lime-400 mb-4" />
            <h2 className="text-white text-2xl font-black uppercase italic mb-2">Sucesso!</h2>
            <p className="text-zinc-400 text-sm font-medium">Sua senha foi atualizada. Redirecionando para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nova Senha"
                  className="w-full h-12 bg-zinc-800 border-2 border-black px-12 text-white font-medium focus:ring-2 focus:ring-lime-400 outline-none transition-all placeholder:text-zinc-600"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a Nova Senha"
                  className="w-full h-12 bg-zinc-800 border-2 border-black px-12 text-white font-medium focus:ring-2 focus:ring-lime-400 outline-none transition-all placeholder:text-zinc-600"
                  required
                />
              </div>
            </div>

            <Button type="submit" isLoading={loading} variant="secondary" className="w-full py-4 text-lg">
              Atualizar Senha
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
