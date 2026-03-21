/**
 * genkit.ts
 * Configuração central do Genkit AI. Suporta múltiplos providers:
 * - googleai (padrão): Google Gemini via @genkit-ai/googleai
 * - ollama: Modelos locais open-source via REST API (http://localhost:11434)
 *
 * Controle via variável de ambiente AI_PROVIDER.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const AI_CONFIG = {
  provider: (process.env.AI_PROVIDER as 'googleai' | 'ollama') || 'googleai',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
  googleModel: 'googleai/gemini-2.0-flash',
} as const;

export const ai = genkit({
  plugins: [googleAI()],
  model: AI_CONFIG.googleModel,
});
