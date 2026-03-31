// src/app/api/reports/ai-generate/route.ts
/**
 * @fileoverview API Route para geração de templates de relatórios via IA.
 * Aceita uma descrição textual ou texto extraído de documento e retorna
 * um template HTML/CSS com variáveis Handlebars para uso no GrapesJS Designer.
 *
 * Suporta dois providers via campo `aiProvider`:
 *   - "genkit" (padrão): Google AI / gemini-2.0-flash via Genkit
 *   - "ollama": Modelo local via servidor Ollama (configure OLLAMA_HOST e OLLAMA_MODEL)
 *
 * contextType é restrito aos 4 contextos implementados em /api/reports/render:
 *   AUCTION, LOT, BIDDER, COURT_CASE
 *
 * POST /api/reports/ai-generate  — gera template
 * GET  /api/reports/ai-generate  — lista modelos Ollama disponíveis
 */
/**
 * @fileoverview API Route para geração de templates de relatórios via IA.
 * Aceita uma descrição textual ou texto extraído de documento e retorna
 * um template HTML/CSS com variáveis Handlebars para uso no GrapesJS Designer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import {
  generateReportTemplate,
  type GenerateReportTemplateInput,
} from '@/ai/flows/generate-report-template-flow';

export const dynamic = 'force-dynamic';

// ============================================================================
// REQUEST SCHEMA
// ============================================================================

const RequestSchema = z.object({
  contextType: z
    .enum(['AUCTION', 'LOT', 'BIDDER', 'COURT_CASE'])
    .default('AUCTION'),
  prompt: z.string().min(10, 'Descreva o template com pelo menos 10 caracteres').max(1000, 'Prompt deve ter no máximo 1.000 caracteres'),
  documentText: z.string().optional(),
  tone: z.enum(['FORMAL_JURIDICO', 'TECNICO', 'COMERCIAL']).default('FORMAL_JURIDICO'),
  language: z.string().default('pt-BR'),
  pageSize: z.enum(['A4', 'Letter', 'Legal']).default('A4'),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  aiProvider: z.enum(['genkit', 'ollama']).optional(),
  ollamaModel: z.string().optional(),
});

// ============================================================================
// POST — gera template
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Corpo da requisição inválido (JSON esperado)' }, { status: 400 });
    }

    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const input: GenerateReportTemplateInput = parseResult.data;

    // Generate template (provider selected inside the flow)
    const result = await generateReportTemplate(input);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error('[AI Generate Route] Erro ao gerar template:', error);

    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao gerar template. Tente novamente.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================================================
// GET — lista modelos Ollama disponíveis
// ============================================================================

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    let listOllamaModels: (() => Promise<string[]>) | null = null;
    try {
      const { loadOllamaListModels } = await import('@/lib/ai-providers/ollama-provider');
      listOllamaModels = await loadOllamaListModels();
    } catch (e) {
      // ollama-provider or ollama not installed
      listOllamaModels = null;
    }
    const models = listOllamaModels ? await listOllamaModels() : [];
    return NextResponse.json({
      success: true,
      models,
      ollamaAvailable: models.length > 0,
    });
  } catch (error) {
    console.error('[AI Generate Route] Erro ao listar modelos Ollama:', error);
    return NextResponse.json({
      success: false,
      models: [],
      ollamaAvailable: false,
      error: error instanceof Error ? error.message : 'Servidor Ollama não disponível',
    });
  }
}
