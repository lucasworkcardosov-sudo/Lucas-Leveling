import React from 'react';
import { Profile } from '../types';
import { getAvatarPath, AVATAR_LIBRARY } from '../lib/avatarLibrary';
import { motion } from 'motion/react';
import { Lock, CheckCircle2, ChevronRight } from 'lucide-react';

interface EvolutionGalleryProps {
  profile: Profile;
}

export const EvolutionGallery = ({ profile }: EvolutionGalleryProps) => {
  const path = getAvatarPath(profile);

  if (path.length === 0) return (
    <div className="bg-zinc-900 border-4 border-black p-8 text-center">
      <p className="text-[10px] font-black uppercase text-zinc-500 font-press leading-relaxed">
        Escolha sua classe e sexo para visualizar sua jornada de evolução.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black uppercase italic tracking-tighter font-press border-l-4 border-lime-400 pl-4">
          Galeria de Evolução
        </h3>
        <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">
          Rank: {profile.class}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {path.map((tier, index) => {
          const isUnlocked = profile.level >= tier.minLevel;
          
          return (
            <motion.div 
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center transition-all ${isUnlocked ? 'bg-white' : 'bg-zinc-100 grayscale'}`}
            >
              {/* Level Badge */}
              <div className={`absolute -top-3 -right-3 px-3 py-1 border-2 border-black font-black italic text-[10px] z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isUnlocked ? 'bg-lime-400 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                LVL {tier.minLevel}
              </div>

              {/* Avatar Frame */}
              <div className={`w-32 h-32 mb-4 border-4 border-black relative overflow-hidden group ${isUnlocked ? 'bg-zinc-900' : 'bg-black/80'}`}>
                <img 
                  src={tier.imageUrl} 
                  alt={tier.name}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${!isUnlocked ? 'opacity-0' : 'opacity-100'}`}
                  referrerPolicy="no-referrer"
                />
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock size={32} className="text-zinc-600" />
                  </div>
                )}
                {isUnlocked && (
                  <div className="absolute top-2 left-2 bg-lime-400 text-black p-1 border-2 border-black">
                    <CheckCircle2 size={12} strokeWidth={3} />
                  </div>
                )}
              </div>

              <div className="text-center w-full">
                <h4 className={`text-xs font-black uppercase mb-1 font-press leading-tight ${isUnlocked ? 'text-black' : 'text-zinc-400'}`}>
                  {tier.name}
                </h4>
                <p className={`text-[8px] font-bold uppercase leading-relaxed ${isUnlocked ? 'text-zinc-500' : 'text-zinc-300'}`}>
                  {isUnlocked ? tier.description : 'Bloqueado pelo Destino'}
                </p>
              </div>

              {index < path.length - 1 && (
                <div className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-20">
                  <ChevronRight size={24} className={isUnlocked ? 'text-lime-400' : 'text-zinc-300'} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
