/**
 * Configuração dos modelos Groq disponíveis na UI (seleção futura).
 * O modelo ativo vem de GROQ_MODEL no .env.local
 */
export const GROQ_MODELS = [
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    description: "Equilíbrio ideal entre velocidade e qualidade",
  },
  {
    id: "llama-3.1-70b-versatile",
    label: "Llama 3.1 70B",
    description: "Versão anterior, ainda muito capaz",
  },
  {
    id: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B Instant",
    description: "Respostas ultra-rápidas",
  },
] as const;

export function getGroqModel(): string {
  return process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
}

/** Modelo com visão para mensagens com imagens */
export function getGroqVisionModel(): string {
  return (
    process.env.GROQ_VISION_MODEL ?? "llama-3.2-11b-vision-preview"
  );
}

export function resolveGroqModel(hasImages: boolean): string {
  return hasImages ? getGroqVisionModel() : getGroqModel();
}
