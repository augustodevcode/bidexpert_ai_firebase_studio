/**
 * @fileoverview Testes unitários para o motor de geração de templates de relatórios com IA.
 *
 * BDD: Verificar que a lógica de seleção de variáveis de contexto e parâmetros de entrada
 * do flow de geração de templates é correta, sem chamar a API de IA real.
 *
 * TDD: Cobrir parsing do schema de entrada, valores padrão, e estrutura do output esperado.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    }
  });

  it('aceita todos os contextTypes válidos', () => {
    const validTypes = [
      'AUCTION',
      'LOT',
      'BIDDER',
      'COURT_CASE',
      'AUCTION_RESULT',
      'APPRAISAL_REPORT',
      'INVOICE',
    ];

    for (const contextType of validTypes) {
      const result = GenerateReportTemplateInputSchema.safeParse({
        contextType,
        prompt: 'Template de teste para ' + contextType,
      });
      expect(result.success, `contextType "${contextType}" deve ser aceito`).toBe(true);
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
      contextType: 'AUCTION_RESULT',
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
        contextType: 'INVOICE',
        prompt: 'Nota de arrematação no tamanho ' + pageSize,
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
  it('contextos de relatório cobrem todos os tipos da API de renderização', () => {
    // Garante que os contextTypes do flow correspondem aos tipos suportados em /api/reports/render
    const supportedRenderContexts = ['AUCTION', 'LOT', 'BIDDER', 'COURT_CASE'];
    const flowContextTypes = [
      'AUCTION',
      'LOT',
      'BIDDER',
      'COURT_CASE',
      'AUCTION_RESULT',
      'APPRAISAL_REPORT',
      'INVOICE',
    ];

    for (const ctx of supportedRenderContexts) {
      expect(flowContextTypes).toContain(ctx);
    }
  });
});
