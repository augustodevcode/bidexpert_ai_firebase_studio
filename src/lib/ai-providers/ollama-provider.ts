// src/lib/ai-providers/ollama-provider.ts
/**
 * @fileoverview Provider Ollama para geração de templates de relatórios.
 * Chama o servidor Ollama local via API REST (pacote npm 'ollama').
 * 
 * Configuração via variáveis de ambiente:
 *   OLLAMA_HOST  — URL do servidor Ollama (padrão: http://localhost:11434)
 *   OLLAMA_MODEL — Modelo a utilizar   (padrão: llama3.2)
 *
 * Para listar modelos disponíveis:  GET http://localhost:11434/api/tags
 * Para instalar um modelo:          ollama pull llama3.2
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
export async function generateWithOllama(
  params: TemplateGenerationParams,
  config?: OllamaProviderConfig
): Promise<TemplateGenerationRawResult> {
  const host = config?.host ?? process.env.OLLAMA_HOST ?? DEFAULT_OLLAMA_HOST;
  const model = config?.model ?? process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;

  // Dynamic import to avoid build issues when ollama is not available
  let OllamaClass: typeof import('ollama').Ollama;
  try {
    const module = await import('ollama');
    OllamaClass = module.Ollama;
  } catch (importErr) {
    throw new Error(
      `Não foi possível carregar o pacote "ollama". Certifique-se que está instalado (npm install ollama). Detalhe: ${importErr instanceof Error ? importErr.message : String(importErr)}`
    );
  }

  const client = new OllamaClass({ host });

  // Verify connectivity before calling generate
  try {
    await client.list();
  } catch (err) {
    throw new Error(
      `Servidor Ollama não acessível em ${host}. Verifique se o serviço está em execução e configure OLLAMA_HOST se necessário. Detalhe: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const response = await client.chat({
    model,
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userPrompt },
    ],
    options: {
      temperature: params.temperature ?? 0.3,
      num_predict: params.maxTokens ?? 8192,
    },
    stream: false,
  });

  const text = response.message?.content ?? '';
  if (!text) {
    throw new Error(`Ollama (${model}) retornou uma resposta vazia. Tente um modelo diferente.`);
  }

  return { text, provider: 'ollama', model };
}

/**
 * Lista modelos disponíveis no servidor Ollama local.
 * Útil para popular o seletor de modelos na UI.
 *
 * @param host - URL do servidor Ollama (padrão: OLLAMA_HOST env ou localhost:11434)
 * @returns Lista de nomes de modelos ou array vazio em caso de falha
 */
export async function listOllamaModels(host?: string): Promise<string[]> {
  const resolvedHost = host ?? process.env.OLLAMA_HOST ?? DEFAULT_OLLAMA_HOST;

  try {
    const module = await import('ollama');
    const client = new module.Ollama({ host: resolvedHost });
    const response = await client.list();
    return (response.models ?? []).map((m: { name: string }) => m.name);
  } catch {
    return [];
  }
}
