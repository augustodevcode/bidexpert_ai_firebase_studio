/**
 * src/lib/ai/provider.ts
 * Camada de abstração de providers de IA para o BidExpert.
 *
 * Suporta dois providers:
 * - googleai: Google Gemini via Genkit (@genkit-ai/googleai)
 * - ollama: Modelos open-source locais via REST API (sem dependências extras)
 *
 * Seleção via env AI_PROVIDER ("googleai" | "ollama").
 * Sem necessidade de instalar pacotes adicionais para Ollama.
 */

import { AI_CONFIG } from '@/ai/genkit';

// ============================================================================
// TYPES
// ============================================================================

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AITextResponse {
  text: string;
  provider: 'googleai' | 'ollama';
}

export interface OllamaChatRequest {
  model: string;
  messages: AIMessage[];
  stream: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
  format?: 'json';
}

export interface OllamaChatResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

// ============================================================================
// OLLAMA DIRECT FETCH
// ============================================================================

/**
 * Chama a API chat do Ollama diretamente via fetch.
 * Não requer nenhum pacote npm adicional.
 */
export async function callOllama(
  messages: AIMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  } = {}
): Promise<AITextResponse> {
  const url = `${AI_CONFIG.ollamaBaseUrl}/api/chat`;

  const body: OllamaChatRequest = {
    model: AI_CONFIG.ollamaModel,
    messages,
    stream: false,
    options: {
      temperature: options.temperature ?? 0.3,
      ...(options.maxTokens ? { num_predict: options.maxTokens } : {}),
    },
    ...(options.jsonMode ? { format: 'json' } : {}),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      `Não foi possível conectar ao Ollama em ${AI_CONFIG.ollamaBaseUrl}. ` +
        `Verifique se o Ollama está em execução: ollama serve. ` +
        `Detalhes: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'erro desconhecido');
    throw new Error(`Ollama retornou erro ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as OllamaChatResponse;

  return {
    text: data.message?.content ?? '',
    provider: 'ollama',
  };
}

/**
 * Chama o Ollama esperando saída JSON e faz parse + validação do resultado.
 * Caso o JSON seja inválido, lança erro com a saída bruta para diagnóstico.
 */
export async function callOllamaForJSON<T>(
  messages: AIMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<T> {
  const result = await callOllama(messages, {
    ...options,
    jsonMode: true,
  });

  // Extrai o JSON da resposta (Ollama pode envolver em ```json ... ```)
  const cleaned = result.text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `Ollama retornou JSON inválido. Saída bruta:\n${result.text.substring(0, 1000)}`
    );
  }
}

// ============================================================================
// UNIFIED STREAMING (Ollama SSE for chatbot)
// ============================================================================

/**
 * Chama Ollama com streaming, retornando um AsyncGenerator de chunks de texto.
 * Ideal para chatbot com resposta progressiva.
 */
export async function* callOllamaStream(
  messages: AIMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): AsyncGenerator<string> {
  const url = `${AI_CONFIG.ollamaBaseUrl}/api/chat`;

  const body = {
    model: AI_CONFIG.ollamaModel,
    messages,
    stream: true,
    options: {
      temperature: options.temperature ?? 0.7,
      ...(options.maxTokens ? { num_predict: options.maxTokens } : {}),
    },
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      `Não foi possível conectar ao Ollama: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!response.ok || !response.body) {
    throw new Error(`Ollama stream error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value, { stream: true }).split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const chunk = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
        if (chunk.message?.content) {
          yield chunk.message.content;
        }
      } catch {
        // ignora linhas não-JSON (keep-alive, etc.)
      }
    }
  }
}

// ============================================================================
// PROVIDER STATUS
// ============================================================================

export function getActiveProvider(): 'googleai' | 'ollama' {
  return AI_CONFIG.provider;
}

export function getProviderLabel(): string {
  if (AI_CONFIG.provider === 'ollama') {
    return `Ollama (${AI_CONFIG.ollamaModel})`;
  }
  return 'Google Gemini 2.0 Flash';
}

/**
 * Testa se o Ollama está acessível. Retorna true se responder corretamente.
 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const resp = await fetch(`${AI_CONFIG.ollamaBaseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return resp.ok;
  } catch {
    return false;
  }
}
