export type UserRole = 'aluno' | 'admin' | 'professor' | 'pendente' | 'player';

export interface Profile {
  id: string;
  full_name: string;
  nickname?: string;
  email: string;
  height?: number;
  weight?: number;
  age?: number;
  goal?: string;
  available_time?: number;
  training_period?: string;
  training_time?: string;
  training_days_per_week?: number;
  accepted_terms?: boolean;
  terms_accepted_at?: string;
  role: UserRole;
  gender?: string;
  xp: number;
  level: number;
  hp?: number;
  mana?: number;
  class?: string;
  avatar_url?: string;
  current_avatar_id?: string;
  instructor_id?: string;
  created_at: string;
}

export interface AvatarLibrary {
  id: string;
  class: string;
  gender: 'M' | 'F';
  min_level: number;
  image_url: string;
  avatar_code: string;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscle_group: string;
  media_url?: string;
  created_at: string;
}

export interface Workout {
  id: string;
  student_id: string;
  name: string;
  description?: string;
  division?: string;
  exercises?: any[]; // For JSONB storage
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise?: Exercise;
  sets: number;
  reps: string;
  rest_time?: number;
  order_index: number;
}
