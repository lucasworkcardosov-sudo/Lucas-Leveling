import React from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { ShieldAlert, LogOut, Clock, Loader2, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export const PendingApprovalPage = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white border-4 border-black p-10 shadow-[16px_16px_0px_0px_rgba(163,230,53,1)] relative overflow-hidden"
      >
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <Clock size={120} className="rotate-[15deg]" />
        </div>

        <div className="relative z-10 text-center">
          <div className="inline-flex p-4 bg-black border-4 border-black mb-8 rotate-[-3deg] shadow-[4px_4px_0px_0px_rgba(163,230,53,1)]">
            <ShieldAlert size={48} className="text-lime-400" />
          </div>

          <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-4 leading-none">
            Acesso em <br />
            <span className="text-lime-500">Análise</span>
          </h1>

          <div className="h-1 w-20 bg-black mx-auto mb-8" />

          <div className="space-y-6 text-zinc-800 font-bold italic uppercase tracking-tight text-sm mb-10">
            <p className="border-l-4 border-lime-400 pl-4 text-left">
              SUA ENTRADA NA GUILDA ESTÁ AGUARDANDO APROVAÇÃO.
            </p>
            <p className="border-l-4 border-black pl-4 text-left">
              UM ARQUIMAGO AVALIARÁ SEU PERFIL EM BREVE.
            </p>
          </div>

          <div className="bg-zinc-900 text-white p-4 border-2 border-black mb-10 shadow-[4px_4px_0px_0px_black]">
            <div className="flex items-center justify-center space-x-3 text-zinc-500 mb-2">
              <Loader2 className="animate-spin" size={18} />
              <span className="text-[10px] font-black tracking-widest uppercase">Protocolo de Verificação Ativo</span>
            </div>
            <p className="text-[9px] font-mono text-zinc-400 uppercase">
              Verificamos cada novo guerreiro manualmente para garantir a integridade do Ecossistema Leveling.
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            <Button onClick={() => window.location.reload()} variant="secondary" className="w-full py-4 text-base">
              Verificar Status Agora
            </Button>
            
            <button 
              onClick={handleSignOut}
              className="flex items-center justify-center space-x-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors py-2"
            >
              <LogOut size={16} />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t-2 border-zinc-100 flex items-center justify-center space-x-2 text-zinc-300">
          <Mail size={14} />
          <span className="text-[9px] font-black uppercase tracking-widest italic">Suporte: suporte@questworkout.app</span>
        </div>
      </motion.div>
    </div>
  );
};
