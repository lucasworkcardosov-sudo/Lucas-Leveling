import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { supabase } from '../lib/supabase';
import { User, Dumbbell, Clock, Target, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const RegistrationForm = ({ onComplete }: { onComplete: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    height: '',
    weight: '',
    goal: '',
    available_time: '',
    training_period: 'manhã',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        goal: formData.goal,
        available_time: parseInt(formData.available_time),
        training_period: formData.training_period,
        status: 'pending',
        role: 'student',
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
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Button type="button" onClick={prevStep} variant="outline">
                  Voltar
                </Button>
                <Button type="submit" isLoading={loading} variant="secondary">
                  Finalizar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        Seu cadastro será analisado pelo instrutor antes da liberação do portal.
      </p>
    </div>
  );
};

// Use helper function inside component
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
