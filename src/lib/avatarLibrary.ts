import { Profile } from '../types';

export interface AvatarEvolution {
  id: string;
  name: string;
  minLevel: number;
  gender: 'M' | 'F';
  class: string;
  imageUrl: string;
  description: string;
}

export const AVATAR_LIBRARY: AvatarEvolution[] = [
  // --- GUERREIRO (M) ---
  {
    id: 'guerreiro_m_1',
    name: 'Recruta de Bronze',
    minLevel: 1,
    gender: 'M',
    class: 'Guerreiro',
    imageUrl: 'https://i.ibb.co/vzR0FmF/warrior-low-m.jpg',
    description: 'Armadura simples e determinação de iniciante.'
  },
  {
    id: 'guerreiro_m_10',
    name: 'Cavaleiro Errante',
    minLevel: 10,
    gender: 'M',
    class: 'Guerreiro',
    imageUrl: 'https://i.ibb.co/xXvS8hT/warrior-mid-m.jpg',
    description: 'Equipamento reforçado e cicatrizes de batalhas reais.'
  },
  {
    id: 'guerreiro_m_30',
    name: 'Paladino de Platina',
    minLevel: 30,
    gender: 'M',
    class: 'Guerreiro',
    imageUrl: 'https://i.ibb.co/YyYf8Hj/warrior-high-m.jpg',
    description: 'Lendário defensor da guilda com armadura divina.'
  },

  // --- GUERREIRA (F) ---
  {
    id: 'guerreira_f_1',
    name: 'Aprendiz de Espada',
    minLevel: 1,
    gender: 'F',
    class: 'Guerreiro',
    imageUrl: 'https://i.ibb.co/rtLz2S2/warrior-low-f.jpg',
    description: 'Agilidade e foco nos primeiros passos do treino.'
  },
  {
    id: 'guerreira_f_10',
    name: 'Valquíria em Ascensão',
    minLevel: 10,
    gender: 'F',
    class: 'Guerreiro',
    imageUrl: 'https://i.ibb.co/v4Kx3P7/warrior-mid-f.jpg',
    description: 'Liderança nata no campo de batalha.'
  },
  {
    id: 'guerreira_f_30',
    name: 'Soberana do Aço',
    minLevel: 30,
    gender: 'F',
    class: 'Guerreiro',
    imageUrl: 'https://i.ibb.co/3kXm4N8/warrior-high-f.jpg',
    description: 'A força absoluta personificada em beleza marcial.'
  },

  // --- MESTRE / PROFESSOR (M) ---
  {
    id: 'mestre_m_1',
    name: 'Erudito da Força',
    minLevel: 1,
    gender: 'M',
    class: 'Mestre',
    imageUrl: 'https://i.ibb.co/9vjY0g5/mage-low-m.jpg',
    description: 'Buscando o equilíbrio entre corpo e mente.'
  },
  {
    id: 'mestre_m_30',
    name: 'Grande Guardião',
    minLevel: 30,
    gender: 'M',
    class: 'Mestre',
    imageUrl: 'https://i.ibb.co/N1W0N5k/mage-high-m.jpg',
    description: 'Mestre dos segredos da performance humana.'
  },

  // --- MESTRE / PROFESSOR (F) ---
  {
    id: 'mestre_f_1',
    name: 'Sábia do Movimento',
    minLevel: 1,
    gender: 'F',
    class: 'Mestre',
    imageUrl: 'https://i.ibb.co/6y4t4mK/mage-low-f.jpg',
    description: 'Iniciando os discípulos na arte do esforço.'
  },
  {
    id: 'mestre_f_30',
    name: 'Sumo Sacerdotisa Fit',
    minLevel: 30,
    gender: 'F',
    class: 'Mestre',
    imageUrl: 'https://i.ibb.co/pLg4K7Y/mage-high-f.jpg',
    description: 'A conexão máxima com o potencial físico.'
  },
];

export function getDynamicAvatar(profile: Profile): string | null {
  if (!profile.class || !profile.gender) return null;

  const validGender = profile.gender === 'M' || profile.gender === 'F' ? profile.gender : 'M';
  
  // Sort by level descending to get the highest reached tier
  const evolutions = AVATAR_LIBRARY
    .filter(a => a.class.toLowerCase() === profile.class.toLowerCase() && a.gender === validGender && a.minLevel <= profile.level)
    .sort((a, b) => b.minLevel - a.minLevel);

  return evolutions.length > 0 ? evolutions[0].imageUrl : null;
}

export function getAvatarPath(profile: Profile): AvatarEvolution[] {
  if (!profile.class || !profile.gender) return [];
  const validGender = profile.gender === 'M' || profile.gender === 'F' ? profile.gender : 'M';
  
  return AVATAR_LIBRARY
    .filter(a => a.class.toLowerCase() === profile.class.toLowerCase() && a.gender === validGender)
    .sort((a, b) => a.minLevel - b.minLevel);
}
