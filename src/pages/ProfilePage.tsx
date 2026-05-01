import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { User, Shield, Key, ArrowLeft, Save, AlertCircle, CheckCircle2, Scale, Ruler, Brain, Zap, Calendar, Clock } from 'lucide-react';

interface ProfilePageProps {
  profile: Profile;
  onRefresh: () => Promise<void>;
}

export const ProfilePage = ({ profile, onRefresh }: ProfilePageProps) => {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [nickname, setNickname] = useState(profile.nickname || '');
  const [weight, setWeight] = useState(profile.weight?.toString() || '');
  const [height, setHeight] = useState(profile.height?.toString() || '');
  const [age, setAge] = useState(profile.age?.toString() || '');
  const [goal, setGoal] = useState(profile.goal || '');
  const [gender, setGender] = useState(profile.gender || 'Masculino');
  const [trainingPeriod, setTrainingPeriod] = useState(profile.training_period || '');
  const [trainingTime, setTrainingTime] = useState(profile.training_time || '');
  const [trainingDays, setTrainingDays] = useState(profile.training_days_per_week?.toString() || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const navigate = useNavigate();

  // Sync state if profile prop changes (e.g. after refresh)
  React.useEffect(() => {
    setFullName(profile.full_name || '');
    setNickname(profile.nickname || '');
    setWeight(profile.weight?.toString() || '');
    setHeight(profile.height?.toString() || '');
    setAge(profile.age?.toString() || '');
    setGoal(profile.goal || '');
    setGender(profile.gender || 'Masculino');
    setTrainingPeriod(profile.training_period || '');
    setTrainingTime(profile.training_time || '');
    setTrainingDays(profile.training_days_per_week?.toString() || '');
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updateData = {
        full_name: fullName,
        nickname: nickname,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        age: age ? parseInt(age) : null,
        goal: goal,
        gender: gender,
        training_period: trainingPeriod,
        training_time: trainingTime,
        training_days_per_week: trainingDays ? parseInt(trainingDays) : null
      };

      console.log('Updating profile for ID:', profile.id, updateData);
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Update Password if provided
      if (newPassword.trim()) {
        if (newPassword.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        const { error: authError } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (authError) throw authError;
      }

      await onRefresh();
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setNewPassword(''); // Clear password field
      
      // Auto-dismiss success message after 3s
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Update error:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar perfil.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#a3e635] font-sans p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-black font-black uppercase tracking-tighter mb-8 hover:translate-x-[-4px] transition-transform"
        >
          <ArrowLeft size={24} className="mr-2" strokeWidth={3} /> Voltar
        </button>

        <div className="bg-white border-8 border-black p-8 md:p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
            <div className="w-32 h-32 bg-zinc-900 border-4 border-black rounded-full flex items-center justify-center relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
               <span className="text-4xl font-black text-white italic">
                 {(profile.nickname || profile.full_name || profile.email || '?')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2)}
               </span>
               <div className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full border-2 border-white">
                  <Shield size={16} />
               </div>
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none mb-2">Editar Perfil</h1>
              <p className="font-bold text-zinc-500 uppercase tracking-widest text-xs">Aperfeiçoe sua identidade de atleta</p>
            </div>
          </div>

          {message && (
            <div className={`mb-8 p-4 border-4 border-black flex items-center space-x-3 ${message.type === 'success' ? 'bg-lime-400' : 'bg-red-400'}`}>
              {message.type === 'success' ? <CheckCircle2 size={24} className="text-black" /> : <AlertCircle size={24} className="text-black" />}
              <span className="font-black uppercase tracking-tight text-sm">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-8">
            <div className="bg-zinc-900 text-white p-4 border-l-8 border-lime-400 mb-8">
               <p className="text-[10px] font-black uppercase tracking-widest leading-tight">
                 <Shield size={12} className="inline mr-2 text-lime-400" />
                 Nota: Suas informações físicas são compartilhadas com seu treinador para a montagem de treinos personalizados.
               </p>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Nome Completo</label>
                   <div className="relative">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                     <input 
                       type="text" 
                       value={fullName}
                       onChange={(e) => setFullName(e.target.value)}
                       className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-lg font-bold placeholder:text-zinc-300 focus:outline-none focus:bg-white transition-colors"
                       placeholder="Seu nome completo"
                       required
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Nickname</label>
                   <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-zinc-400 text-xl italic">@</span>
                     <input 
                       type="text" 
                       value={nickname}
                       onChange={(e) => setNickname(e.target.value)}
                       className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-lg font-bold placeholder:text-zinc-300 focus:outline-none focus:bg-white transition-colors"
                       placeholder="seu_apelido"
                     />
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Peso (kg)</label>
                    <div className="relative">
                      <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                      <input 
                        type="number" 
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-lg font-bold focus:outline-none focus:bg-white transition-colors"
                        placeholder="00.0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Altura (cm)</label>
                    <div className="relative">
                      <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                      <input 
                        type="number" 
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-lg font-bold focus:outline-none focus:bg-white transition-colors"
                        placeholder="000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Idade</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                      <input 
                        type="number" 
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-lg font-bold focus:outline-none focus:bg-white transition-colors"
                        placeholder="00"
                      />
                    </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Objetivo Principal</label>
                  <div className="relative">
                    <Brain className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <select 
                      value={goal || ''}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-lg font-bold focus:outline-none focus:bg-white transition-colors appearance-none uppercase italic"
                    >
                      <option value="" disabled>Selecione um objetivo</option>
                      <option value="Hipertrofia">Hipertrofia</option>
                      <option value="Emagrecimento">Emagrecimento</option>
                      <option value="Condicionamento">Condicionamento Físico</option>
                      <option value="Força">Ganho de Força</option>
                      <option value="Saúde">Saúde e Bem-estar</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Gênero</label>
                  <div className="grid grid-cols-3 gap-2">
                     {['Masculino', 'Feminino', 'Outro'].map((g) => (
                       <button
                         key={g}
                         type="button"
                         onClick={() => setGender(g)}
                         className={`py-3 border-4 border-black font-black uppercase italic text-sm transition-all ${
                           gender === g ? 'bg-black text-white' : 'bg-white text-black hover:bg-zinc-100'
                         }`}
                       >
                         {g === 'Outro' ? 'NÃO DIZER' : g}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Nível de Experiência</label>
                  <div className="relative">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <select 
                      value={trainingPeriod || ''}
                      onChange={(e) => setTrainingPeriod(e.target.value)}
                      className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-lg font-bold focus:outline-none focus:bg-white transition-colors appearance-none uppercase italic"
                    >
                      <option value="" disabled>Quanto tempo você treina?</option>
                      <option value="Iniciante (0-6 meses)">Iniciante (0-6 meses)</option>
                      <option value="Intermediário (6-12 meses)">Intermediário (6-12 meses)</option>
                      <option value="Avançado (1-2 anos)">Avançado (1-2 anos)</option>
                      <option value="Elite (2+ anos)">Elite (2+ anos)</option>
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Período de Treino</label>
                   <div className="relative">
                     <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                     <select 
                       value={trainingTime || ''}
                       onChange={(e) => setTrainingTime(e.target.value)}
                       className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-lg font-bold focus:outline-none focus:bg-white transition-colors appearance-none uppercase italic"
                     >
                       <option value="" disabled>Qual seu melhor horário?</option>
                       <option value="Manhã">Manhã</option>
                       <option value="Tarde">Tarde</option>
                       <option value="Noite">Noite</option>
                     </select>
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Frequência Semanal</label>
                   <div className="relative">
                     <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                     <input 
                       type="number" 
                       min="1"
                       max="7"
                       value={trainingDays}
                       onChange={(e) => setTrainingDays(e.target.value)}
                       className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-lg font-bold focus:outline-none focus:bg-white transition-colors"
                       placeholder="Ex: 5 dias"
                     />
                   </div>
                 </div>
               </div>

               <div className="pt-6 border-t-4 border-zinc-100">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Nova Senha</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-lg font-bold placeholder:text-zinc-300 focus:outline-none focus:bg-white transition-colors"
                        placeholder="••••••••"
                      />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Deixe em branco para manter a atual</p>
                  </div>
               </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-16 text-xl"
              isLoading={loading}
            >
              <Save size={24} className="mr-3" /> Salvar Alterações
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
