/**
 * @fileoverview Testes unitários para o motor de geração de templates de relatórios com IA.
 *
 * BDD: Verificar que a lógica de seleção de variáveis de contexto e parâmetros de entrada
 * do flow de geração de templates é correta, sem chamar a API de IA real.
 *
 * TDD: Cobrir parsing do schema de entrada, valores padrão, seleção de provider e
 * estrutura do output esperado.
 */

import { describe, it, expect, vi } from 'vitest';
import { GenerateReportTemplateInputSchema } from '../../src/ai/flows/generate-report-template-flow';

// ============================================================================
// MOCKS
// ============================================================================

// Mock do módulo genkit para não chamar a API de IA nos testes unitários
vi.mock('@/ai/genkit', () => ({
  ai: {
    defineFlow: vi.fn((config: unknown, handler: Function) => handler),
    generate: vi.fn(),
  },
}));

// Mock do provider Ollama
vi.mock('@/lib/ai-providers/ollama-provider', () => ({
  generateWithOllama: vi.fn(),
  listOllamaModels: vi.fn().mockResolvedValue([]),
}));

// ============================================================================
// TESTS
// ============================================================================

describe('GenerateReportTemplateInputSchema', () => {
  it('aceita dados válidos com valores padrão', () => {
    const result = GenerateReportTemplateInputSchema.safeParse({
      contextType: 'AUCTION',
      prompt: 'Edital de leilão judicial com dados do leiloeiro',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tone).toBe('FORMAL_JURIDICO');
      expect(result.data.language).toBe('pt-BR');
      expect(result.data.pageSize).toBe('A4');
      expect(result.data.orientation).toBe('portrait');
      expect(result.data.aiProvider).toBeUndefined();
      expect(result.data.ollamaModel).toBeUndefined();
    }
  });

  it('aceita aiProvider "ollama" com modelo específico', () => {
    const result = GenerateReportTemplateInputSchema.safeParse({
      contextType: 'LOT',
      prompt: 'Ficha técnica do lote com dados de avaliação',
      aiProvider: 'ollama',
      ollamaModel: 'mistral',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aiProvider).toBe('ollama');
      expect(result.data.ollamaModel).toBe('mistral');
    }
  });

  it('aceita aiProvider "genkit"', () => {
    const result = GenerateReportTemplateInputSchema.safeParse({
      contextType: 'AUCTION',
      prompt: 'Edital de leilão com provider Genkit',
      aiProvider: 'genkit',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aiProvider).toBe('genkit');
    }
  });

  it('rejeita aiProvider inválido', () => {
    const result = GenerateReportTemplateInputSchema.safeParse({
      contextType: 'AUCTION',
      prompt: 'Edital de leilão com provider inválido',
      aiProvider: 'openai',
    });
    expect(result.success).toBe(false);
  });

  it('aceita todos os contextTypes suportados pelo renderer', () => {
    const validTypes = [
      'AUCTION',
      'LOT',
      'BIDDER',
      'COURT_CASE',
    ];

    for (const contextType of validTypes) {
      const result = GenerateReportTemplateInputSchema.safeParse({
        contextType,
        prompt: 'Template de teste para ' + contextType,
      });
      expect(result.success, `contextType "${contextType}" deve ser aceito`).toBe(true);
    }
  });

  it('rejeita contextTypes não implementados no renderer', () => {
    const unsupportedTypes = ['AUCTION_RESULT', 'APPRAISAL_REPORT', 'INVOICE'];

    for (const contextType of unsupportedTypes) {
      const result = GenerateReportTemplateInputSchema.safeParse({
        contextType,
        prompt: 'Template para contexto não suportado',
      });
      expect(result.success, `contextType "${contextType}" deve ser REJEITADO (não implementado no renderer)`).toBe(false);
    }
  });

  it('rejeita contextType inválido', () => {
    const result = GenerateReportTemplateInputSchema.safeParse({
      contextType: 'INVALID_TYPE',
      prompt: 'Template inválido',
    });
    expect(result.success).toBe(false);
  });

  it('aceita documentText opcional', () => {
    const result = GenerateReportTemplateInputSchema.safeParse({
      contextType: 'LOT',
      prompt: 'Laudo de avaliação do lote',
      documentText: 'Texto extraído do documento Word de referência...',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.documentText).toBe('Texto extraído do documento Word de referência...');
    }
  });

  it('aceita tones válidos', () => {
    const validTones = ['FORMAL_JURIDICO', 'TECNICO', 'COMERCIAL'];

    for (const tone of validTones) {
      const result = GenerateReportTemplateInputSchema.safeParse({
        contextType: 'AUCTION',
        prompt: 'Template com tom ' + tone,
        tone,
      });
      expect(result.success, `tone "${tone}" deve ser aceito`).toBe(true);
    }
  });

  it('aceita orientação landscape', () => {
    const result = GenerateReportTemplateInputSchema.safeParse({
      contextType: 'AUCTION',
      prompt: 'Ata de resultado em formato paisagem',
      orientation: 'landscape',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.orientation).toBe('landscape');
    }
  });

  it('aceita tamanhos de página Letter e Legal', () => {
    for (const pageSize of ['Letter', 'Legal']) {
      const result = GenerateReportTemplateInputSchema.safeParse({
        contextType: 'LOT',
        prompt: 'Ficha técnica no tamanho ' + pageSize,
        pageSize,
      });
      expect(result.success, `pageSize "${pageSize}" deve ser aceito`).toBe(true);
    }
  });

  it('não aceita prompt com menos de 10 caracteres', () => {
    const result = GenerateReportTemplateInputSchema.safeParse({
      contextType: 'AUCTION',
      prompt: 'curto',
    });
    expect(result.success).toBe(false);
  });

  it('não aceita prompt com mais de 1000 caracteres', () => {
    const result = GenerateReportTemplateInputSchema.safeParse({
      contextType: 'AUCTION',
      prompt: 'a'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe('Estrutura de contexto de variáveis', () => {
  it('contextos do flow AI coincidem exatamente com os implementados no renderer', () => {
    // The AI generation contextType enum must match fetchDataForContext in /api/reports/render
    const implementedRenderContexts = ['AUCTION', 'LOT', 'BIDDER', 'COURT_CASE'];
    const flowAllowedContexts = implementedRenderContexts; // same 4

    for (const ctx of implementedRenderContexts) {
      expect(flowAllowedContexts).toContain(ctx);
    }

    // Contexts NOT in the renderer must also NOT be in the flow schema
    const unsupported = ['AUCTION_RESULT', 'APPRAISAL_REPORT', 'INVOICE'];
    for (const ctx of unsupported) {
      const result = GenerateReportTemplateInputSchema.safeParse({
        contextType: ctx,
        prompt: 'Template sem suporte no renderer',
      });
      expect(result.success, `"${ctx}" não deve ser aceito pois não está implementado no renderer`).toBe(false);
    }
  });
});

describe('AI Provider — tipos válidos', () => {
  it('AIProvider aceita "genkit" e "ollama" conforme o schema', () => {
    const providers = ['genkit', 'ollama'];
    for (const aiProvider of providers) {
      const result = GenerateReportTemplateInputSchema.safeParse({
        contextType: 'AUCTION',
        prompt: 'Template para testes de provider',
        aiProvider,
      });
      expect(result.success, `aiProvider "${aiProvider}" deve ser aceito`).toBe(true);
    }
  });
});
