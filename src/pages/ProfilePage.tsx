import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { User, Shield, Key, ArrowLeft, Save, AlertCircle, CheckCircle2, Scale, Ruler, Brain, Zap, Calendar, Clock, Sword, Axe, Target, Zap as Agility } from 'lucide-react';

import { AvatarUpload } from '../components/AvatarUpload';
import { EvolutionGallery } from '../components/EvolutionGallery';
import { getDynamicAvatar } from '../lib/avatarLibrary';

interface ProfilePageProps {
  profile: Profile;
  onRefresh: () => Promise<void>;
}

const CLASSES = [
  { id: 'guerreiro', name: 'Guerreiro', description: 'Força Bruta', icon: Sword, color: 'bg-red-500' },
  { id: 'elfo', name: 'Elfo', description: 'Destreza Pura', icon: Target, color: 'bg-green-500' },
  { id: 'anao', name: 'Anão', description: 'Resistência', icon: Axe, color: 'bg-amber-700' },
  { id: 'ladino', name: 'Ladino', description: 'Agilidade', icon: Agility, color: 'bg-zinc-600' }
];

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
  const [selectedClass, setSelectedClass] = useState(profile.class || '');
  const [isFlashing, setIsFlashing] = useState(false);
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
    setGender(profile.gender || 'M');
    setTrainingPeriod(profile.training_period || '');
    setTrainingTime(profile.training_time || '');
    setTrainingDays(profile.training_days_per_week?.toString() || '');
    setSelectedClass(profile.class || '');
  }, [profile]);

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 500);
  };

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
        training_days_per_week: trainingDays ? parseInt(trainingDays) : null,
        class: selectedClass
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
    <div className={`min-h-screen bg-[#a3e635] font-pixel p-6 md:p-12 transition-colors duration-500 ${isFlashing ? 'animate-flash-green' : ''}`}>
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-black font-black uppercase tracking-tighter mb-8 hover:translate-x-[-4px] transition-transform font-press text-[10px]"
        >
          <ArrowLeft size={16} className="mr-2" strokeWidth={3} /> [ VOLTAR ]
        </button>

        <div className="bg-white border-[6px] border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] pixel-card">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
            <AvatarUpload 
              userId={profile.id}
              currentAvatarUrl={profile.avatar_url || getDynamicAvatar(profile)}
              onUploadComplete={() => onRefresh()}
              initials={(profile.nickname || profile.full_name || profile.email || '?')
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2)}
            />
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none mb-2 font-press text-2xl md:text-3xl">Editar Herói</h1>
              <p className="font-bold text-zinc-500 uppercase tracking-widest text-sm">Personalize os atributos do seu personagem</p>
            </div>
          </div>

          {message && (
            <div className={`mb-8 p-4 border-[6px] border-black flex items-center space-x-3 ${message.type === 'success' ? 'bg-lime-400' : 'bg-red-400'}`}>
              {message.type === 'success' ? <CheckCircle2 size={24} className="text-black" /> : <AlertCircle size={24} className="text-black" />}
              <span className="font-black uppercase tracking-tight text-lg">{message.text}</span>
            </div>
          )}

          <div className="mb-12">
            <h2 className="text-xl font-black uppercase mb-6 font-press text-sm border-b-4 border-black pb-2 inline-block">ESCOLHA SUA CLASSE</h2>
            <div className="grid grid-cols-2 gap-4">
               {CLASSES.map((cls) => {
                 const Icon = cls.icon;
                 const isSelected = selectedClass === cls.id;
                 return (
                   <button
                     key={cls.id}
                     type="button"
                     onClick={() => handleClassSelect(cls.id)}
                     className={`p-4 border-4 border-black transition-all flex flex-col items-center gap-2 group relative ${
                       isSelected 
                       ? 'bg-black text-white scale-105 shadow-[6px_6px_0px_0px_#FFD700] border-rpg-gold z-10' 
                       : 'bg-zinc-50 text-black hover:bg-zinc-100 hover:translate-y-[-2px]'
                     }`}
                   >
                     {isSelected && (
                       <div className="absolute -top-3 -right-3 bg-rpg-gold text-black p-1 border-2 border-black rotate-12 animate-bounce">
                         <span className="text-[10px] font-black uppercase font-press">TOP</span>
                       </div>
                     )}
                     <div className={`w-12 h-12 flex items-center justify-center border-2 border-black ${isSelected ? 'bg-zinc-800' : 'bg-white'}`}>
                       <Icon size={24} className={isSelected ? 'text-rpg-gold' : 'text-black'} strokeWidth={3} />
                     </div>
                     <span className="font-press text-[10px] uppercase leading-tight">{cls.name}</span>
                     <span className="text-[10px] font-bold uppercase opacity-60">{cls.description}</span>
                   </button>
                 );
               })}
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-8">
            <div className="bg-zinc-900 text-white p-4 border-l-8 border-rpg-gold mb-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 opacity-10 font-press text-4xl rotate-12">LVL {profile.level}</div>
               <p className="text-sm font-black uppercase tracking-widest leading-tight relative z-10">
                 <Shield size={14} className="inline mr-2 text-rpg-gold" />
                 Atributos compartilhados com o Mestre do Santuário.
               </p>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-1">Nome de Herói</label>
                   <div className="relative">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                     <input 
                       type="text" 
                       value={fullName}
                       onChange={(e) => setFullName(e.target.value)}
                       className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-xl font-bold placeholder:text-zinc-300 focus:outline-none focus:bg-white transition-colors"
                       placeholder="Seu nome real"
                       required
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-1">Codinome</label>
                   <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-zinc-400 text-xl italic font-press">@</span>
                     <input 
                       type="text" 
                       value={nickname}
                       onChange={(e) => setNickname(e.target.value)}
                       className="w-full bg-zinc-50 border-4 border-black p-4 pl-14 text-xl font-bold placeholder:text-zinc-300 focus:outline-none focus:bg-white transition-colors"
                       placeholder="nick"
                     />
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-1">Carga (kg)</label>
                    <div className="relative">
                      <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                      <input 
                        type="number" 
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-xl font-bold focus:outline-none focus:bg-white transition-colors"
                        placeholder="00.0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-1">Envergadura (cm)</label>
                    <div className="relative">
                      <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                      <input 
                        type="number" 
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-xl font-bold focus:outline-none focus:bg-white transition-colors"
                        placeholder="000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-1">Ciclos</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                      <input 
                        type="number" 
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-xl font-bold focus:outline-none focus:bg-white transition-colors"
                        placeholder="00"
                      />
                    </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-1">Sua Quest Principal</label>
                  <div className="relative">
                    <Brain className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <select 
                      value={goal || ''}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-xl font-bold focus:outline-none focus:bg-white transition-colors appearance-none uppercase italic"
                    >
                      <option value="" disabled>Qual seu objetivo?</option>
                      <option value="Hipertrofia">Ganho de Massa (Bulk)</option>
                      <option value="Emagrecimento">Definição (Cut)</option>
                      <option value="Condicionamento">Jornada de Resistência</option>
                      <option value="Força">Força Bruta</option>
                      <option value="Saúde">Manutenção (Saúde)</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-1">Sexo do Avatar</label>
                  <div className="grid grid-cols-2 gap-4">
                     {[{ id: 'M', label: 'MASCULINO (He)' }, { id: 'F', label: 'FEMININO (She)' }].map((g) => (
                       <button
                         key={g.id}
                         type="button"
                         onClick={() => setGender(g.id)}
                         className={`py-4 border-4 border-black font-black uppercase italic text-xs transition-all flex items-center justify-center gap-2 ${
                           gender === g.id ? 'bg-black text-white shadow-[4px_4px_0px_0px_#A3E635]' : 'bg-white text-black hover:bg-zinc-100'
                         }`}
                       >
                         <Shield size={16} className={gender === g.id ? 'text-lime-400' : 'text-zinc-300'} />
                         {g.label}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-1">Experiência de Jogo</label>
                  <div className="relative">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <select 
                      value={trainingPeriod || ''}
                      onChange={(e) => setTrainingPeriod(e.target.value)}
                      className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-xl font-bold focus:outline-none focus:bg-white transition-all appearance-none uppercase italic"
                    >
                      <option value="" disabled>Há quanto tempo nesta jornada?</option>
                      <option value="Iniciante (0-6 meses)">Novo Recruta (0-6m)</option>
                      <option value="Intermediário (6-12 meses)">Aventureiro (6-12m)</option>
                      <option value="Avançado (1-2 anos)">Veterano (1-2a)</option>
                      <option value="Elite (2+ anos)">Herói Lendário (2a+)</option>
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-1">Horário de Dungeon</label>
                   <div className="relative">
                     <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                     <select 
                       value={trainingTime || ''}
                       onChange={(e) => setTrainingTime(e.target.value)}
                       className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-xl font-bold focus:outline-none focus:bg-white transition-colors appearance-none uppercase italic"
                     >
                       <option value="" disabled>Melhor horário?</option>
                       <option value="Manhã">Patrulha da Alvorada</option>
                       <option value="Tarde">Incursão do Meio-Dia</option>
                       <option value="Noite">Turno da Noite</option>
                     </select>
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-1">Dungeons / Semana</label>
                   <div className="relative">
                     <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                     <input 
                       type="number" 
                       min="1"
                       max="7"
                       value={trainingDays}
                       onChange={(e) => setTrainingDays(e.target.value)}
                       className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-xl font-bold focus:outline-none focus:bg-white transition-colors"
                       placeholder="Ex: 5"
                     />
                   </div>
                 </div>
               </div>

               <div className="pt-6 border-t-8 border-black">
                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-1">Selo de Segurança (Senha)</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-zinc-50 border-4 border-black p-4 pl-12 text-xl font-bold placeholder:text-zinc-300 focus:outline-none focus:bg-white transition-colors font-press"
                        placeholder="••••"
                      />
                    </div>
                  </div>
               </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-20 text-2xl font-press !border-8 border-black shadow-[8px_8px_0px_0px_#CD7F32]"
              isLoading={loading}
            >
              <Save size={24} className="mr-3" /> [ SALVAR ]
            </Button>
          </form>

          {/* Evolution Gallery */}
          <div className="mt-16 pt-12 border-t-8 border-black">
            <EvolutionGallery profile={profile} />
          </div>
        </div>
      </div>
    </div>
  );
};
