export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  height?: number;
  weight?: number;
  goal?: string;
  available_time?: number;
  training_period?: string;
  status: UserStatus;
  role: UserRole;
  xp: number;
  level: number;
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
