import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getAlternateExercise(originalExercise: string, muscleGroup: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é um instrutor de academia experiente. O aluno está fazendo o exercício "${originalExercise}" para o grupamento muscular "${muscleGroup}", mas o aparelho está ocupado. Sugira um exercício alternativo eficiente para o mesmo grupamento muscular que utilize pesos livres ou outro equipamento comum. Responda apenas com o nome do exercício e uma breve explicação de 1 frase.`,
    });

    return response.text;
  } catch (error) {
    console.error("Error fetching alternate exercise:", error);
    return "Não foi possível sugerir um exercício alternativo no momento.";
  }
}
