// src/lib/ai-providers/ollama-provider.ts
/**
 * @fileoverview Provider Ollama para geração de templates de relatórios.
 * Chama o servidor Ollama local via API REST (pacote npm 'ollama').

 */
/**
 * @fileoverview Provider Ollama para geração de templates de relatórios.
 * Chama o servidor Ollama local via API REST (pacote npm 'ollama').
 */

import type { OllamaProviderConfig, TemplateGenerationParams, TemplateGenerationRawResult } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_OLLAMA_HOST = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.2';

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * Gera texto usando um servidor Ollama local.
 * 
 * @param params - Prompts de sistema e usuário, configurações de temperatura
 * @param config - Configuração opcional de host e modelo Ollama
 * @returns Texto gerado pelo modelo
 * @throws Error se o servidor Ollama não estiver acessível ou o modelo não existir
 */
// Only export if ollama is available (for build safety)

// These are only dynamic proxies to avoid static references to 'ollama'.
export async function loadOllamaProvider() {
  if (typeof process !== 'undefined' && process.release && process.release.name === 'node') {
    return (await import('./node-only/ollama-dynamic.node')).generateWithOllama;
  }
  throw new Error('Ollama provider só pode ser carregado em ambiente Node.js');
}

export async function loadOllamaListModels() {
  if (typeof process !== 'undefined' && process.release && process.release.name === 'node') {
    return (await import('./node-only/ollama-dynamic.node')).listOllamaModels;
  }
  throw new Error('Ollama provider só pode ser carregado em ambiente Node.js');
}
