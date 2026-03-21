/**
 * src/app/api/ai/status/route.ts
 * Endpoint público para consultar o estado do provider AI ativo.
 *
 * GET /api/ai/status
 * Retorna: { provider, label, ollamaHealthy? }
 *
 * Usado pelo frontend para exibir o badge do provider no Report Builder e chatbot.
 */

import { NextResponse } from 'next/server';
import { AI_CONFIG } from '@/ai/genkit';
import { getProviderLabel, checkOllamaHealth } from '@/lib/ai/provider';

export const dynamic = 'force-dynamic';

export async function GET() {
  const provider = AI_CONFIG.provider;
  const label = getProviderLabel();

  if (provider === 'ollama') {
    const ollamaHealthy = await checkOllamaHealth();
    return NextResponse.json(
      {
        provider,
        label,
        ollamaHealthy,
        ollamaBaseUrl: AI_CONFIG.ollamaBaseUrl,
        ollamaModel: AI_CONFIG.ollamaModel,
      },
      {
        headers: {
          // Short cache: status can change if Ollama is started/stopped
          'Cache-Control': 'public, max-age=10',
        },
      }
    );
  }

  return NextResponse.json(
    { provider, label },
    {
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    }
  );
}
