export async function uploadImage(file: File): Promise<string> {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY || '166f2584caab19bee035b78aaf32ea3f';
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Falha ao fazer upload da imagem');
  }

  const data = await response.json();
  return data.data.url;
}
