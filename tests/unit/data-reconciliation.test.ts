/**
 * @fileoverview Testes unitários para o serviço de reconciliação de dados.
 * Cobre normalização monetária, mapeamento de enums, detecção de causa raiz
 * e geração de relatório Markdown.
 *
 * BDD:
 * - Dado um valor monetário "R$ 500.000,00" extraído da UI,
 *   Quando normalizado, Então deve retornar 500000.00
 * - Dado um status "ABERTO_PARA_LANCES" no DB,
 *   Quando comparado com "Aberto para Lances" na UI,
 *   Então deve ser considerado correspondente.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock Prisma client and dependencies that rely on Node.js-only modules
// so the pure utility functions can be tested in the browser vitest environment.
vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));
vi.mock('@prisma/client/runtime/library', () => ({
  Decimal: class Decimal {
    constructor(public value: string | number) {}
    toString() { return String(this.value); }
    toNumber() { return Number(this.value); }
  },
}));
vi.mock('@/lib/format', () => ({
  toMonetaryNumber: (val: string) => {
    const cleaned = val.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  },
  formatCurrency: (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
}));
vi.mock('@/lib/timezone', () => ({
  nowInSaoPaulo: () => new Date('2026-02-22T12:00:00-03:00'),
  formatInSaoPaulo: (d: Date, fmt: string) => d.toISOString(),
}));

import {
  normalizeUICurrency,
  normalizeDBDecimal,
  statusMatchesUI,
  compareCurrencyValues,
  hasResidualDecimals,
  inferRootCause,
  generateReportMarkdown,
  AUCTION_STATUS_UI_MAP,
  LOT_STATUS_UI_MAP,
  BID_STATUS_UI_MAP,
} from '../../src/services/data-reconciliation.service';
import type { ReconciliationReport } from '../../src/services/data-reconciliation.service';

// ─────────────────────────────────────────────────
// normalizeUICurrency
// ─────────────────────────────────────────────────

describe('normalizeUICurrency', () => {
  it('deve normalizar valor brasileiro padrão', () => {
    expect(normalizeUICurrency('R$ 500.000,00')).toBe(500000.00);
  });

  it('deve normalizar valor sem espaço após R$', () => {
    expect(normalizeUICurrency('R$1.234.567,89')).toBe(1234567.89);
  });

  it('deve normalizar valor com centavos', () => {
    expect(normalizeUICurrency('R$ 150,50')).toBe(150.50);
  });

  it('deve tratar valor inteiro sem centavos', () => {
    expect(normalizeUICurrency('R$ 1.000')).toBe(1000);
  });

  it('deve retornar 0 para string vazia', () => {
    expect(normalizeUICurrency('')).toBe(0);
  });

  it('deve retornar 0 para null/undefined', () => {
    expect(normalizeUICurrency(null as unknown as string)).toBe(0);
    expect(normalizeUICurrency(undefined as unknown as string)).toBe(0);
  });

  it('deve normalizar valor em USD', () => {
    expect(normalizeUICurrency('US$ 1.000,00')).toBe(1000.00);
  });

  it('deve normalizar valor em EUR', () => {
    expect(normalizeUICurrency('€ 2.500,75')).toBe(2500.75);
  });

  it('deve tratar "N/A" e traços como 0', () => {
    expect(normalizeUICurrency('N/A')).toBe(0);
    expect(normalizeUICurrency('—')).toBe(0);
  });
});

// ─────────────────────────────────────────────────
// normalizeDBDecimal
// ─────────────────────────────────────────────────

describe('normalizeDBDecimal', () => {
  it('deve normalizar number com 2 casas', () => {
    expect(normalizeDBDecimal(500000.00)).toBe(500000.00);
  });

  it('deve arredondar para 2 casas', () => {
    expect(normalizeDBDecimal(123.456)).toBe(123.46);
  });

  it('deve tratar string numérica', () => {
    expect(normalizeDBDecimal('1500.50')).toBe(1500.50);
  });

  it('deve retornar 0 para null', () => {
    expect(normalizeDBDecimal(null)).toBe(0);
  });

  it('deve retornar 0 para undefined', () => {
    expect(normalizeDBDecimal(undefined)).toBe(0);
  });

  it('deve tratar Decimal object via toString', () => {
    const fakeDecimal = { toString: () => '789.12' };
    expect(normalizeDBDecimal(fakeDecimal as unknown as number)).toBe(789.12);
  });
});

// ─────────────────────────────────────────────────
// statusMatchesUI
// ─────────────────────────────────────────────────

describe('statusMatchesUI', () => {
  describe('Auction Status', () => {
    it('deve casar ABERTO_PARA_LANCES com "Aberto para Lances"', () => {
      expect(statusMatchesUI('ABERTO_PARA_LANCES', 'Aberto para Lances', AUCTION_STATUS_UI_MAP)).toBe(true);
    });

    it('deve casar ABERTO_PARA_LANCES com variante "Aberto Para Lances"', () => {
      expect(statusMatchesUI('ABERTO_PARA_LANCES', 'Aberto Para Lances', AUCTION_STATUS_UI_MAP)).toBe(true);
    });

    it('deve casar EM_PREGAO com "Em Pregão"', () => {
      expect(statusMatchesUI('EM_PREGAO', 'Em Pregão', AUCTION_STATUS_UI_MAP)).toBe(true);
    });

    it('deve rejeitar status incorreto', () => {
      expect(statusMatchesUI('ABERTO', 'Fechado', AUCTION_STATUS_UI_MAP)).toBe(false);
    });

    it('deve rejeitar enum desconhecido', () => {
      expect(statusMatchesUI('INEXISTENTE', 'Teste', AUCTION_STATUS_UI_MAP)).toBe(false);
    });

    it('deve ser case-insensitive na comparação UI', () => {
      expect(statusMatchesUI('ENCERRADO', 'encerrado', AUCTION_STATUS_UI_MAP)).toBe(true);
    });
  });

  describe('Lot Status', () => {
    it('deve casar VENDIDO com "Vendido"', () => {
      expect(statusMatchesUI('VENDIDO', 'Vendido', LOT_STATUS_UI_MAP)).toBe(true);
    });

    it('deve casar VENDIDO com variante "Arrematado"', () => {
      expect(statusMatchesUI('VENDIDO', 'Arrematado', LOT_STATUS_UI_MAP)).toBe(true);
    });
  });

  describe('Bid Status', () => {
    it('deve casar VENCEDOR com "Vencedor"', () => {
      expect(statusMatchesUI('VENCEDOR', 'Vencedor', BID_STATUS_UI_MAP)).toBe(true);
    });

    it('deve casar VENCEDOR com variante "Ganhador"', () => {
      expect(statusMatchesUI('VENCEDOR', 'Ganhador', BID_STATUS_UI_MAP)).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────
// compareCurrencyValues
// ─────────────────────────────────────────────────

describe('compareCurrencyValues', () => {
  it('deve retornar null quando valores são iguais', () => {
    expect(compareCurrencyValues(500000, 500000, 'price')).toBeNull();
  });

  it('deve retornar null para diferença < 0.01', () => {
    expect(compareCurrencyValues(500000.001, 500000.005, 'price')).toBeNull();
  });

  it('deve detectar divergência monetária', () => {
    const result = compareCurrencyValues(500000, 499000, 'price');
    expect(result).not.toBeNull();
    expect(result!.percentage).toBe('0.2%');
  });

  it('deve tratar dbValue zero', () => {
    const result = compareCurrencyValues(0, 100, 'price');
    expect(result).not.toBeNull();
    expect(result!.percentage).toBe('∞%');
  });
});

// ─────────────────────────────────────────────────
// hasResidualDecimals
// ─────────────────────────────────────────────────

describe('hasResidualDecimals', () => {
  it('deve retornar false para 2 casas decimais', () => {
    expect(hasResidualDecimals(500000.00)).toBe(false);
  });

  it('deve retornar true para casas residuais', () => {
    expect(hasResidualDecimals(500000.00003)).toBe(true);
  });

  it('deve retornar false para inteiro', () => {
    expect(hasResidualDecimals(500000)).toBe(false);
  });

  it('deve retornar false para 1 casa decimal', () => {
    expect(hasResidualDecimals(100.5)).toBe(false);
  });
});

// ─────────────────────────────────────────────────
// inferRootCause
// ─────────────────────────────────────────────────

describe('inferRootCause', () => {
  it('deve detectar N+1 quando UI está vazia', () => {
    const result = inferRootCause('price', '500000', '');
    expect(result.code).toBe('N_PLUS_1');
  });

  it('deve detectar N+1 para N/A na UI', () => {
    const result = inferRootCause('title', 'Leilão X', 'N/A');
    expect(result.code).toBe('N_PLUS_1');
  });

  it('deve detectar CACHE_NO_INVALIDATE para campo monetário divergente', () => {
    const result = inferRootCause('price', '500000', 'R$ 499.000,00');
    expect(result.code).toBe('CACHE_NO_INVALIDATE');
  });

  it('deve detectar STALE_REACT_STATE para campo de status', () => {
    const result = inferRootCause('status', 'ABERTO_PARA_LANCES', 'Encerrado');
    expect(result.code).toBe('STALE_REACT_STATE');
  });

  it('deve detectar MISSING_REVALIDATE para contador', () => {
    const result = inferRootCause('bidsCount', '15', '12');
    expect(result.code).toBe('MISSING_REVALIDATE');
  });

  it('deve retornar UNKNOWN para campo não categorizado', () => {
    const result = inferRootCause('randomField', 'abc', 'def');
    expect(result.code).toBe('UNKNOWN');
  });
});

// ─────────────────────────────────────────────────
// generateReportMarkdown
// ─────────────────────────────────────────────────

describe('generateReportMarkdown', () => {
  const baseReport: ReconciliationReport = {
    metadata: {
      date: '2026-02-22T15:00:00Z',
      environment: 'demo',
      tenantSlug: 'demo',
      agentVersion: 'data-reconciliation-auditor@1.0.0',
      durationMs: 5432,
      queriesExecuted: 12,
      pagesNavigated: 5,
      consoleErrorsCaptured: 0,
    },
    summary: {
      auctionsAudited: 3,
      lotsAudited: 15,
      bidsAudited: 42,
      pagesVerified: 5,
      divergencesFound: 2,
      criticalDivergences: 1,
      consistencyRate: 96.7,
    },
    divergences: [
      {
        id: 1,
        severity: 'CRITICA',
        entityType: 'Lot',
        entityId: '123',
        entityLabel: 'Apartamento Centro SP',
        pageUrl: '/auction/leilao-sp/lot/apt-centro',
        selector: '[data-ai-id="lot-current-price"]',
        fieldName: 'price',
        dbValue: 'R$ 500.000,00',
        uiValue: 'R$ 499.000,00',
        delta: 'R$ 1.000,00',
        rootCauseCode: 'CACHE_NO_INVALIDATE',
        rootCauseDescription: 'Cache SWR não invalidado',
        recommendation: 'Adicionar revalidatePath na server action',
        timestamp: new Date('2026-02-22T15:00:00Z'),
      },
    ],
    referentialIntegrity: {
      auctionsWithoutLots: 0,
      lotsWithoutValidAuction: 1,
      orphanBids: 0,
      desyncedCounters: [
        {
          entityType: 'Lot',
          entityId: '456',
          fieldName: 'bidsCount',
          storedValue: 10,
          calculatedValue: 12,
        },
      ],
    },
    recommendations: [
      'Adicionar revalidateTag após mutação de preço',
      'Corrigir contador bidsCount do Lote #456',
    ],
  };

  it('deve gerar Markdown válido com cabeçalho', () => {
    const md = generateReportMarkdown(baseReport);
    expect(md).toContain('# Relatório de Reconciliação de Dados');
    expect(md).toContain('**Data**: 2026-02-22T15:00:00Z');
    expect(md).toContain('**Ambiente**: demo');
  });

  it('deve incluir tabela de resumo', () => {
    const md = generateReportMarkdown(baseReport);
    expect(md).toContain('| Leilões Auditados | 3 |');
    expect(md).toContain('| Taxa de Consistência | 96.7% |');
  });

  it('deve listar divergências com severidade', () => {
    const md = generateReportMarkdown(baseReport);
    expect(md).toContain('🔴 DIVERGÊNCIA #1 — CRITICA');
    expect(md).toContain('**Valor DB**: R$ 500.000,00');
    expect(md).toContain('CACHE_NO_INVALIDATE');
  });

  it('deve incluir integridade referencial', () => {
    const md = generateReportMarkdown(baseReport);
    expect(md).toContain('| Contadores Desincronizados | 1 |');
    expect(md).toContain('| Lot | 456 | bidsCount | 10 | 12 |');
  });

  it('deve incluir recomendações', () => {
    const md = generateReportMarkdown(baseReport);
    expect(md).toContain('1. Adicionar revalidateTag após mutação de preço');
  });

  it('deve gerar mensagem de sucesso quando sem divergências', () => {
    const cleanReport: ReconciliationReport = {
      ...baseReport,
      summary: { ...baseReport.summary, divergencesFound: 0 },
      divergences: [],
    };
    const md = generateReportMarkdown(cleanReport);
    expect(md).toContain('Nenhuma divergência encontrada');
  });
});
