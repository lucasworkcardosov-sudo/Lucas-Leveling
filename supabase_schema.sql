-- ESTRUTURA DO BANCO DE DADOS: Workout Quest

-- 1. Tabela de Perfis (Profiles)
-- Extende a tabela auth.users do Supabase
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  height DECIMAL, -- em cm
  weight DECIMAL, -- em kg
  goal TEXT, -- objetivo
  available_time INTEGER, -- tempo disponível em minutos
  training_period TEXT, -- manhã, tarde, noite
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabela de Exercícios (Exercises)
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  muscle_group TEXT NOT NULL,
  media_url TEXT, -- link para GIF ou Vídeo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabela de Treinos (Workouts)
CREATE TABLE workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Ex: Treino A - Superior
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tabela de Exercícios do Treino (Workout Exercises)
-- Liga exercícios específicos a um treino com suas séries/repetições
CREATE TABLE workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL,
  reps TEXT NOT NULL, -- pode ser '12', '10-12', 'Fadiga', etc.
  rest_time INTEGER, -- em segundos
  order_index INTEGER NOT NULL, -- ordem no treino
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Histórico de Treinos (Treino Finalizado)
CREATE TABLE workout_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id),
  xp_gained INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;

-- Políticas Básicas (Exemplos)
CREATE POLICY "Public exercises are viewable by everyone" ON exercises FOR SELECT USING (true);
CREATE POLICY "Profiles are viewable by users themselves" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can see all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
