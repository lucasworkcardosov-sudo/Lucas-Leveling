import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { AvatarLibrary } from '../types';
import { 
  Plus, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  Filter, 
  ChevronLeft, 
  Loader2, 
  ShieldAlert,
  User,
  Users,
  Grid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export const AdminAvatarsPage = () => {
  const [avatars, setAvatars] = useState<AvatarLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  
  // Form State
  const [selectedClass, setSelectedClass] = useState('Guerreiro');
  const [selectedGender, setSelectedGender] = useState<'M' | 'F'>('M');
  const [minLevel, setMinLevel] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isMasterAdmin = user.email === 'lucas.cadoso@gmail.com' || user.email === 'lucas.workcardosov@gmail.com';
    if (profile?.role !== 'admin' && !isMasterAdmin) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    fetchAvatars();
  };

  const fetchAvatars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('avatar_library')
        .select('*')
        .order('class', { ascending: true })
        .order('min_level', { ascending: true });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "avatar_library" does not exist')) {
          console.warn("Table avatar_library might not exist yet.");
          setAvatars([]);
        } else {
          throw error;
        }
      } else {
        setAvatars(data || []);
      }
    } catch (error) {
      console.error('Error fetching avatars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadToImgBB = async (file: File) => {
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (!apiKey) throw new Error("API Key do ImgBB não configurada no .env");
    
    const formData = new FormData();
    formData.append("image", file);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });
    
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error.message || "Falha no upload para o ImgBB");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const imageUrl = await uploadToImgBB(selectedFile);
      const avatarCode = `${selectedClass}_${selectedGender}_${minLevel}`;

      const { error } = await supabase
        .from('avatar_library')
        .insert([{
          class: selectedClass,
          gender: selectedGender,
          min_level: minLevel,
          image_url: imageUrl,
          avatar_code: avatarCode
        }]);

      if (error) throw error;

      alert('Avatar adicionado com sucesso!');
      setIsModalOpen(false);
      resetForm();
      fetchAvatars();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert(`Erro: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este avatar?')) return;

    try {
      const { error } = await supabase
        .from('avatar_library')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAvatars(prev => prev.filter(a => a.id !== id));
    } catch (error: any) {
      console.error('Error deleting avatar:', error);
      alert('Erro ao excluir avatar.');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setMinLevel(1);
  };

  const groupedAvatars = avatars.reduce((acc, curr) => {
    if (!acc[curr.class]) acc[curr.class] = [];
    acc[curr.class].push(curr);
    return acc;
  }, {} as Record<string, AvatarLibrary[]>);

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-white font-sans">
        <div className="bg-white border-4 border-black p-8 max-w-md w-full shadow-[16px_16px_0px_0px_rgba(239,68,68,1)] text-center">
          <ShieldAlert size={64} className="mx-auto text-red-600 mb-6" />
          <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-black">Acesso Negado</h1>
          <p className="text-zinc-600 font-bold mb-8 italic">Área restrita aos Arquimagos do sistema.</p>
          <Button onClick={() => navigate('/admin')} className="w-full">Voltar ao Painel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans p-6 md:p-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-500 p-2 border-2 border-black rotate-[-3deg] shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <ImageIcon className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Biblioteca de <span className="text-blue-400">Avatares</span></h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Gestão de Arte por Classe e Nível</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button onClick={() => navigate('/admin')} variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white">
            <ChevronLeft size={18} className="mr-2" /> Voltar ao Painel
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <Plus size={18} className="mr-2" /> Novo Avatar
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-12">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-400" size={64} />
            <p className="mt-4 font-black uppercase text-zinc-600 italic">Carregando Galeria...</p>
          </div>
        ) : Object.keys(groupedAvatars).length === 0 ? (
          <div className="bg-zinc-900 border-4 border-dashed border-zinc-800 p-20 text-center rounded-xl">
            <ImageIcon className="mx-auto text-zinc-800 mb-6" size={80} />
            <h3 className="text-2xl font-black uppercase text-zinc-700 italic">Nenhum avatar cadastrado</h3>
            <p className="text-zinc-500 font-bold mt-2">Clique no botão "Novo Avatar" para começar a preencher sua biblioteca.</p>
          </div>
        ) : (
          (Object.entries(groupedAvatars) as [string, AvatarLibrary[]][]).map(([className, classAvatars]) => (
            <div key={className} className="space-y-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-black uppercase italic bg-white text-black px-4 py-1 skew-x-[-10deg]">{className}</h2>
                <div className="h-1 bg-zinc-800 flex-1"></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {classAvatars.map((avatar) => (
                  <motion.div 
                    key={avatar.id}
                    layoutId={avatar.id}
                    className="group relative bg-zinc-900 border-2 border-black p-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(59,130,246,0.5)] transition-all"
                  >
                    <div className="aspect-[3/4] bg-black border-2 border-zinc-800 overflow-hidden relative">
                      <img 
                        src={avatar.image_url} 
                        alt={`${avatar.class} Level ${avatar.min_level}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 bg-blue-600 text-white font-black text-[10px] px-2 py-0.5 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">
                        NV {avatar.min_level}
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/80 text-zinc-400 font-black text-[9px] px-2 py-0.5 border border-zinc-800 uppercase">
                        {avatar.gender === 'M' ? 'Masculino' : 'Feminino'}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleDelete(avatar.id)}
                      className="absolute -top-3 -right-3 bg-red-600 p-2 border-2 border-black rounded-full text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border-4 border-blue-600 w-full max-w-lg p-8 shadow-[16px_16px_0px_0px_rgba(59,130,246,0.3)]"
            >
              <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-6 text-blue-400">Novo Upload de Arte</h2>
              
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Classe Alvo</label>
                    <select 
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full bg-black border-2 border-zinc-800 p-3 text-sm font-black uppercase italic focus:border-blue-600 outline-none"
                    >
                      <option value="Guerreiro">Guerreiro</option>
                      <option value="Arquimago">Arquimago</option>
                      <option value="Mestre">Mestre</option>
                      <option value="Assassino">Assassino</option>
                      <option value="Explorador">Explorador</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sexo</label>
                    <div className="flex bg-black border-2 border-zinc-800 p-1">
                      <button 
                        type="button"
                        onClick={() => setSelectedGender('M')}
                        className={`flex-1 p-2 text-xs font-black uppercase italic transition-all ${selectedGender === 'M' ? 'bg-blue-600 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                      >
                        MASCULINO
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSelectedGender('F')}
                        className={`flex-1 p-2 text-xs font-black uppercase italic transition-all ${selectedGender === 'F' ? 'bg-blue-600 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                      >
                        FEMININO
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nível Mínimo Requerido ({minLevel})</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={minLevel}
                    onChange={(e) => setMinLevel(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-black border border-zinc-800 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] font-black italic text-zinc-700">
                    <span>NV 1</span>
                    <span>NV 50</span>
                    <span>NV 100</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Arquivo de Imagem (PNG/JPG)</label>
                  {!previewUrl ? (
                    <label className="flex flex-col items-center justify-center w-full h-40 bg-black border-2 border-dashed border-zinc-800 cursor-pointer hover:border-blue-600 transition-colors group">
                      <Upload className="text-zinc-700 group-hover:text-blue-600 mb-2 transition-colors" size={32} />
                      <p className="text-[10px] font-black uppercase text-zinc-700 group-hover:text-zinc-400 transition-colors italic">Clique para selecionar</p>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  ) : (
                    <div className="relative group">
                      <img src={previewUrl} className="w-full h-40 object-cover border-2 border-blue-600 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.3)]" />
                      <button 
                        type="button"
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                        className="absolute top-2 right-2 bg-red-600 p-2 border-2 border-black rounded-full text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-110"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    variant="outline" 
                    className="flex-1 border-zinc-800 text-zinc-400"
                    disabled={uploading}
                  >
                    CANCELAR
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
                    disabled={uploading || !selectedFile}
                  >
                    {uploading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Upload className="mr-2" size={18} />}
                    {uploading ? 'ENVIANDO...' : 'SALVAR NA GUILDA'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SQL Warning */}
      <div className="fixed bottom-6 right-6 max-w-xs bg-amber-400 text-black p-4 border-2 border-black font-black text-[10px] uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-40">
        <div className="flex items-center mb-1">
          <ShieldAlert size={14} className="mr-2" /> 
          <span>Aviso ao Administrador</span>
        </div>
        <p className="opacity-80">Certifique-se de que a tabela 'avatar_library' exista no Supabase. Se o upload falhar, verifique seu console.</p>
      </div>
    </div>
  );
};
