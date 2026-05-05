import React, { useState, useRef } from 'react';
import { Camera, Loader2, Shield, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadImage } from '../lib/imgbb';
import { supabase } from '../lib/supabase';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string;
  onUploadComplete: (url: string) => void;
  initials: string;
}

export const AvatarUpload = ({ userId, currentAvatarUrl, onUploadComplete, initials }: AvatarUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 2MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 1. Upload to ImgBB
      const avatarUrl = await uploadImage(file);

      // 2. Update Supabase profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 3. Notify parent
      onUploadComplete(avatarUrl);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setError(err.message || 'Erro ao processar imagem.');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative group">
      {/* RPG Avatar Frame */}
      <div className="w-32 h-32 bg-zinc-900 border-[6px] border-rpg-gold flex items-center justify-center relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {currentAvatarUrl ? (
          <img 
            src={currentAvatarUrl} 
            alt="Avatar" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-4xl font-black text-white italic font-press">
            {initials}
          </span>
        )}

        <div className="absolute bottom-0 right-0 bg-rpg-gold text-black p-2 border-2 border-black">
          <Shield size={16} strokeWidth={3} />
        </div>

        {/* Upload Overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer disabled:cursor-not-allowed"
        >
          <Camera size={24} className="mb-1" />
          <span className="text-[8px] font-black uppercase font-press">Mudar Face</span>
        </button>

        {/* Loading State */}
        <AnimatePresence>
          {isUploading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-900/90 flex flex-col items-center justify-center p-4 text-center"
            >
              <div className="w-full bg-black border-2 border-black h-4 mb-3 p-0.5 relative overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="h-full bg-lime-400 [image-rendering:pixelated]"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.2) 50%)',
                    backgroundSize: '8px 100%'
                  }}
                />
              </div>
              <span className="text-[7px] font-black uppercase font-press text-white animate-pulse">
                ENCANTANDO SEU AVATAR...
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 bg-red-500 border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-20"
          >
            <div className="flex items-center space-x-2 text-white">
              <AlertCircle size={14} className="shrink-0" />
              <span className="text-[8px] font-black uppercase font-press leading-tight">{error}</span>
            </div>
            <button 
              onClick={() => setError(null)}
              className="absolute -top-2 -right-2 bg-black text-white w-5 h-5 flex items-center justify-center text-[10px] font-black border-2 border-white rounded-full hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
