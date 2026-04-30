import React from 'react';
import { RegistrationForm } from '../components/RegistrationForm';
import { useNavigate, Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] text-center">
      <div className="mb-8">
        <div className="bg-black p-3 border-2 border-black inline-block rotate-3">
          <Dumbbell className="text-lime-400" size={32} />
        </div>
      </div>
      <RegistrationForm onComplete={() => navigate('/login')} />
      <Link to="/login" className="mt-8 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors underline">
        Já tem uma conta? Voltar ao Login
      </Link>
    </div>
  );
};
