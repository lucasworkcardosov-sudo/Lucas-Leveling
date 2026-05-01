import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { supabase } from '../lib/supabase';
import { User, Dumbbell, Clock, Target, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const RegistrationForm = ({ onComplete }: { onComplete: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    height: '',
    weight: '',
    goal: '',
    available_time: '',
    training_period: 'manhã',
    gender: 'Masculino',
    accepted_terms: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign Up in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário.');

      // 2. Create Profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: formData.full_name,
        email: formData.email,
        gender: formData.gender,
        height: parseFloat(formData.height) || null,
        weight: parseFloat(formData.weight) || null,
        goal: formData.goal,
        available_time: parseInt(formData.available_time) || null,
        training_period: formData.training_period,
        role: 'aluno',
        accepted_terms: true,
        terms_accepted_at: new Date().toISOString()
      });

      if (profileError) throw profileError;

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao registrar.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="w-full max-w-md mx-auto bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-black uppercase tracking-tighter italic">
          Join the <span className="text-lime-500">Quest</span>
        </h2>
        <div className="flex space-x-1">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                "h-2 w-8 border-2 border-black transition-colors",
                step >= s ? "bg-black" : "bg-zinc-200"
              )}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 border-2 border-red-500 bg-red-50 text-red-600 font-bold uppercase text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="space-y-4"
            >
              <Input
                label="Nome Completo"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Ex: João Silva"
                required
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="joao@atleta.com"
                required
              />
              <Input
                label="Senha"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                required
              />
              <Button type="button" onClick={nextStep} className="w-full" variant="secondary">
                Próximo Passo
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Altura (cm)"
                  name="height"
                  type="number"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="175"
                />
                <Input
                  label="Peso (kg)"
                  name="weight"
                  type="number"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="75"
                />
              </div>
              <Input
                label="Objetivo"
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                placeholder="Ex: Ganho de Massa"
              />
              <Input
                label="Tempo Disponível (min)"
                name="available_time"
                type="number"
                value={formData.available_time}
                onChange={handleChange}
                placeholder="60"
              />
              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-600">
                  Gênero
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Masculino', 'Feminino', 'Outro'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g })}
                      className={`h-10 border-2 border-black text-[10px] font-black uppercase tracking-tighter transition-colors ${
                        formData.gender === g ? 'bg-black text-white' : 'bg-white text-black hover:bg-zinc-100'
                      }`}
                    >
                      {g === 'Outro' ? 'Prefiro não dizer' : g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-600">
                  Período de Treino
                </label>
                <select
                  name="training_period"
                  value={formData.training_period}
                  onChange={handleChange}
                  className="flex h-12 w-full border-2 border-black bg-white px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 appearance-none"
                >
                  <option value="manhã">Manhã</option>
                  <option value="tarde">Tarde</option>
                  <option value="noite">Noite</option>
                </select>
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <div className="flex items-center h-5">
                  <input
                    id="accepted_terms"
                    name="accepted_terms"
                    type="checkbox"
                    checked={formData.accepted_terms}
                    onChange={handleChange}
                    required
                    className="w-5 h-5 border-2 border-black rounded-none appearance-none checked:bg-lime-400 checked:border-black transition-colors cursor-pointer"
                  />
                </div>
                <div className="text-xs leading-tight">
                  <label htmlFor="accepted_terms" className="font-bold text-zinc-600 cursor-pointer">
                    Li e aceito os{' '}
                    <button 
                      type="button" 
                      onClick={() => setIsTermsModalOpen(true)}
                      className="text-black underline hover:text-lime-600 transition-colors"
                    >
                      Termos de Uso e Políticas de Privacidade
                    </button>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <Button type="button" onClick={prevStep} variant="outline">
                  Voltar
                </Button>
                <Button 
                  type="submit" 
                  isLoading={loading} 
                  variant="secondary" 
                  disabled={!formData.accepted_terms}
                >
                  Finalizar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Terms of Use Modal */}
      <AnimatePresence>
        {isTermsModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white border-4 border-black w-full max-w-2xl max-h-[80vh] flex flex-col shadow-[16px_16px_0px_0px_rgba(163,230,53,1)]"
            >
              <div className="bg-black text-white p-6 border-b-4 border-black flex justify-between items-center sticky top-0">
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Termos de Uso e Privacidade</h3>
                <button onClick={() => setIsTermsModalOpen(false)} className="hover:text-lime-400 transition-colors">
                   <X size={24} strokeWidth={3} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto text-sm space-y-6 font-medium text-zinc-700">
                <section>
                  <h4 className="font-black uppercase text-black mb-2">1. Coleta de Dados</h4>
                  <p>Coletamos informações como seu nome, e-mail, peso, altura e objetivos de treinamento para fornecer rotinas de exercícios personalizadas. Esses dados são armazenados de forma segura e utilizados apenas para o funcionamento da plataforma.</p>
                </section>
                
                <section>
                  <h4 className="font-black uppercase text-black mb-2">2. Responsabilidade</h4>
                  <p>A prática de exercícios físicos envolve riscos. Você declara estar em condições físicas adequadas para realizar os treinamentos propostos. Recomendamos a consulta com um médico antes de iniciar qualquer programa de exercícios intenso.</p>
                </section>
                
                <section>
                  <h4 className="font-black uppercase text-black mb-2">3. Uso de IA</h4>
                  <p>Nossa plataforma utiliza algoritmos de inteligência artificial para auxiliar na montagem de treinos. As sugestões devem ser interpretadas como orientações e podem ser ajustadas pelo treinador responsável.</p>
                </section>
                
                <section>
                  <h4 className="font-black uppercase text-black mb-2">4. Privacidade</h4>
                  <p>Seus dados de saúde (peso, altura, treinos) são compartilhados com seu treinador designado para permitir o acompanhamento profissional. Não vendemos suas informações para terceiros.</p>
                </section>

                <p className="pt-4 border-t border-zinc-100 text-[10px] uppercase font-black text-zinc-400">Última atualização: 01 de Maio de 2026</p>
              </div>

              <div className="p-6 bg-zinc-50 border-t-4 border-black flex justify-end">
                <Button onClick={() => setIsTermsModalOpen(false)} variant="secondary">
                  Entendi
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        Pronto para começar seu treinamento.
      </p>
    </div>
  );
};

// Use helper function inside component
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
