// src/lib/ai-providers/ollama-dynamic.ts
/**
 * This file is ONLY dynamically imported. It is never statically imported anywhere.
 * It contains all references to the 'ollama' package to avoid build-time errors.
 */
import type { OllamaProviderConfig, TemplateGenerationParams, TemplateGenerationRawResult } from './types';

const DEFAULT_OLLAMA_HOST = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.2';

export async function generateWithOllama(
  params: TemplateGenerationParams,
  config?: OllamaProviderConfig
): Promise<TemplateGenerationRawResult> {
  const host = config?.host ?? process.env.OLLAMA_HOST ?? DEFAULT_OLLAMA_HOST;
  const model = config?.model ?? process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
  let ollamaModule: any;
  try {
    ollamaModule = await import('ollama');
  } catch (e) {
    throw new Error('Ollama provider is not installed. Please install the "ollama" package to use this feature.');
  }
  const OllamaClass = ollamaModule.Ollama;
  const client = new OllamaClass({ host });
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

export async function listOllamaModels(host?: string): Promise<string[]> {
  const resolvedHost = host ?? process.env.OLLAMA_HOST ?? DEFAULT_OLLAMA_HOST;
  try {
    const ollamaModule = await import('ollama');
    const client = new ollamaModule.Ollama({ host: resolvedHost });
    const response = await client.list();
    return (response.models ?? []).map((m: { name: string }) => m.name);
  } catch (e) {
    // If ollama is not installed, return empty list
    return [];
  }
}
