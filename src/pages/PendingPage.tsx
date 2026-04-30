import React from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { ShieldAlert, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

export const PendingPage = () => {
  const handleLogout = () => supabase.auth.signOut();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center"
      >
        <ShieldAlert size={64} className="mx-auto text-amber-500 mb-6" />
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 italic">
          Acesso <span className="text-amber-500">Bloqueado</span>
        </h2>
        <p className="font-medium text-zinc-600 mb-8 leading-tight">
          Seu cadastro foi recebido com sucesso! <br />
          Para garantir a melhor experiência, um treinador precisa aprovar seu perfil e preparar seu primeiro treino.
        </p>
        <div className="p-4 bg-zinc-100 border-2 border-dashed border-zinc-400 rounded-lg animate-pulse mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Status: Pendente de Aprovação</span>
        </div>
        <Button onClick={handleLogout} variant="outline" className="w-full">
          <LogOut className="mr-2 h-4 w-4" /> Sair da Conta
        </Button>
      </motion.div>
    </div>
  );
};
