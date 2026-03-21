// src/lib/ai-providers/types.ts
/**
 * @fileoverview Tipos compartilhados para providers de IA no sistema de geração de templates.
 * Abstrai a interface comum entre Genkit/Google AI e Ollama.
 */

// ============================================================================
// AI PROVIDER TYPES
// ============================================================================

/**
 * Providers de IA suportados para geração de templates de relatórios.
 * - `genkit`: Google AI (gemini-2.0-flash) via Genkit — requer GOOGLEAI_API_KEY
 * - `ollama`: Ollama local — requer servidor Ollama em execução (padrão: http://localhost:11434)
 */
export type AIProvider = 'genkit' | 'ollama';

/**
 * Parâmetros de geração de template passados para qualquer provider.
 */
export interface TemplateGenerationParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Resultado bruto retornado pelo provider de IA antes do parsing.
 */
export interface TemplateGenerationRawResult {
  text: string;
  provider: AIProvider;
  model: string;
}

/**
 * Configuração do provider Ollama.
 */
export interface OllamaProviderConfig {
  /** Host do servidor Ollama. Padrão: OLLAMA_HOST env var ou 'http://localhost:11434' */
  host?: string;
  /** Modelo a usar. Padrão: OLLAMA_MODEL env var ou 'llama3.2' */
  model?: string;
}

/**
 * Configuração do provider Genkit (Google AI).
 */
export interface GenkitProviderConfig {
  /** Modelo do Google AI. Padrão: 'googleai/gemini-2.0-flash' */
  model?: string;
}
