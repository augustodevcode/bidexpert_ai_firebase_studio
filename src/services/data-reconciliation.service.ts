/**
 * @fileoverview Serviço de reconciliação de dados que compara o estado do banco
 * de dados (Prisma) com os valores renderizados na UI (Playwright MCP).
 *
 * Este módulo é a engine central do Data Reconciliation Auditor Agent.
 * Ele encapsula toda a lógica de coleta, normalização e comparação,
 * gerando relatórios estruturados de divergências.
 *
 * BDD: Dado que um leilão existe no banco com status ABERTO_PARA_LANCES,
 *       Quando o auditor navega para /lots/[id],
 *       Então o preço exibido na UI DEVE corresponder exactamente ao valor do DB.
 *
 * TDD: Cobrir normalização monetária, mapeamento de enums e geração de relatório.
 */

import { prisma } from '@/lib/prisma';
import { toMonetaryNumber, formatCurrency } from '@/lib/format';
import { nowInSaoPaulo, formatInSaoPaulo } from '@/lib/timezone';
import type { Decimal } from '@prisma/client/runtime/library';

// ─────────────────────────────────────────────────
// TIPOS E INTERFACES
// ─────────────────────────────────────────────────

/** Severidade de uma divergência detectada */
export type DivergenceSeverity = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA';

/** Código de causa raiz arquitetural */
export type RootCauseCode =
  | 'CACHE_TTL'
  | 'CACHE_NO_INVALIDATE'
  | 'N_PLUS_1'
  | 'SERIAL_MISMATCH'
  | 'RACE_CONDITION'
  | 'FORMAT_ERROR'
  | 'STALE_REACT_STATE'
  | 'MISSING_REVALIDATE'
  | 'REFERENTIAL_INTEGRITY'
  | 'UNKNOWN';

/** Registro individual de divergência */
export interface DivergenceRecord {
  id: number;
  severity: DivergenceSeverity;
  entityType: 'Auction' | 'Lot' | 'Bid' | 'UserWin';
  entityId: string;
  entityLabel: string;
  pageUrl: string;
  selector: string;
  fieldName: string;
  dbValue: string;
  uiValue: string;
  delta: string;
  rootCauseCode: RootCauseCode;
  rootCauseDescription: string;
  recommendation: string;
  traceId?: string;
  timestamp: Date;
}

/** Resumo de integridade referencial */
export interface ReferentialIntegrityReport {
  auctionsWithoutLots: number;
  lotsWithoutValidAuction: number;
  orphanBids: number;
  desyncedCounters: DesyncedCounter[];
}

/** Contador desincronizado */
export interface DesyncedCounter {
  entityType: string;
  entityId: string;
  fieldName: string;
  storedValue: number;
  calculatedValue: number;
}

/** Resultado completo de uma auditoria */
export interface ReconciliationReport {
  metadata: {
    date: string;
    environment: string;
    tenantSlug: string;
    agentVersion: string;
    durationMs: number;
    queriesExecuted: number;
    pagesNavigated: number;
    consoleErrorsCaptured: number;
  };
  summary: {
    auctionsAudited: number;
    lotsAudited: number;
    bidsAudited: number;
    pagesVerified: number;
    divergencesFound: number;
    criticalDivergences: number;
    consistencyRate: number;
  };
  divergences: DivergenceRecord[];
  referentialIntegrity: ReferentialIntegrityReport;
  recommendations: string[];
}

// ─────────────────────────────────────────────────
// MAPEAMENTO DE ENUMS (Prisma → UI)
// ─────────────────────────────────────────────────

export const AUCTION_STATUS_UI_MAP: Record<string, string[]> = {
  RASCUNHO: ['Rascunho'],
  EM_VALIDACAO: ['Em Validação'],
  EM_AJUSTE: ['Em Ajuste'],
  EM_PREPARACAO: ['Em Preparação'],
  EM_BREVE: ['Em Breve'],
  ABERTO: ['Aberto'],
  ABERTO_PARA_LANCES: ['Aberto para Lances', 'Aberto Para Lances'],
  EM_PREGAO: ['Em Pregão'],
  ENCERRADO: ['Encerrado'],
  FINALIZADO: ['Finalizado'],
  CANCELADO: ['Cancelado'],
  SUSPENSO: ['Suspenso'],
};

export const LOT_STATUS_UI_MAP: Record<string, string[]> = {
  RASCUNHO: ['Rascunho'],
  AGUARDANDO: ['Aguardando'],
  EM_BREVE: ['Em Breve'],
  ABERTO_PARA_LANCES: ['Aberto para Lances', 'Aberto Para Lances'],
  EM_PREGAO: ['Em Pregão'],
  ENCERRADO: ['Encerrado'],
  VENDIDO: ['Vendido', 'Arrematado'],
  NAO_VENDIDO: ['Não Vendido'],
  RELISTADO: ['Relistado'],
  CANCELADO: ['Cancelado'],
  RETIRADO: ['Retirado'],
};

export const BID_STATUS_UI_MAP: Record<string, string[]> = {
  ATIVO: ['Ativo', 'Válido'],
  CANCELADO: ['Cancelado'],
  VENCEDOR: ['Vencedor', 'Ganhador'],
  EXPIRADO: ['Expirado'],
};

// ─────────────────────────────────────────────────
// FUNÇÕES DE NORMALIZAÇÃO
// ─────────────────────────────────────────────────

/**
 * Normaliza um valor monetário extraído da UI (string) para número comparável.
 * Remove R$, pontos de milhar, converte vírgula decimal para ponto.
 *
 * @example normalizeUICurrency("R$ 500.000,00") => 500000.00
 * @example normalizeUICurrency("R$1.234.567,89") => 1234567.89
 */
export function normalizeUICurrency(uiText: string): number {
  if (!uiText || typeof uiText !== 'string') return 0;

  const cleaned = uiText
    .replace(/R\$\s?/g, '')     // Remove R$ e espaço opcional
    .replace(/US\$\s?/g, '')    // Remove US$
    .replace(/€\s?/g, '')       // Remove €
    .replace(/\./g, '')         // Remove pontos de milhar (pt-BR)
    .replace(',', '.')          // Converte vírgula decimal para ponto
    .replace(/[^\d.-]/g, '')    // Remove qualquer outro caractere não-numérico
    .trim();

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

/**
 * Normaliza um Decimal do Prisma para número comparável com 2 casas.
 */
export function normalizeDBDecimal(value: Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const numeric = typeof value === 'number' ? value : parseFloat(String(value));
  return isNaN(numeric) ? 0 : Math.round(numeric * 100) / 100;
}

/**
 * Verifica se um status da UI corresponde ao enum do banco de dados.
 * Usa o mapa de variantes aceitas para cada enum.
 */
export function statusMatchesUI(
  dbStatus: string,
  uiText: string,
  statusMap: Record<string, string[]>
): boolean {
  const acceptedVariants = statusMap[dbStatus];
  if (!acceptedVariants) return false;

  const normalizedUI = uiText.trim().toLowerCase();
  return acceptedVariants.some(
    (variant) => variant.toLowerCase() === normalizedUI
  );
}

/**
 * Compara dois valores monetários e retorna a divergência formatada.
 * Retorna null se os valores são iguais.
 */
export function compareCurrencyValues(
  dbValue: number,
  uiValue: number,
  fieldName: string
): { delta: string; percentage: string } | null {
  if (Math.abs(dbValue - uiValue) < 0.01) return null;

  const delta = Math.abs(dbValue - uiValue);
  const percentage = dbValue > 0
    ? ((delta / dbValue) * 100).toFixed(1)
    : '∞';

  return {
    delta: formatCurrency(delta),
    percentage: `${percentage}%`,
  };
}

/**
 * Detecta casas decimais residuais (bug de formatação/serialização).
 * Ex: 500000.00003 é um sinal de bug de floating point.
 */
export function hasResidualDecimals(value: number): boolean {
  const str = String(value);
  const decimalPart = str.split('.')[1];
  if (!decimalPart) return false;
  return decimalPart.length > 2;
}

// ─────────────────────────────────────────────────
// QUERIES DE COLETA (Prisma - Somente Leitura)
// ─────────────────────────────────────────────────

/**
 * Recupera os N leilões mais ativos (com mais lances recentes) para um tenant.
 */
export async function getActivestAuctions(tenantId: bigint, limit: number = 5) {
  const auctions = await prisma.auction.findMany({
    where: {
      tenantId,
      status: {
        in: ['ABERTO', 'ABERTO_PARA_LANCES', 'EM_PREGAO'],
      },
    },
    include: {
      Lot: {
        select: {
          id: true,
          title: true,
          price: true,
          initialPrice: true,
          status: true,
          bidsCount: true,
          endDate: true,
          slug: true,
          publicId: true,
        },
      },
      _count: {
        select: { Lot: true },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: limit,
  });

  return auctions;
}

/**
 * Recupera todos os lances ativos de um lote específico.
 */
export async function getActiveBidsForLot(lotId: bigint) {
  return prisma.bid.findMany({
    where: {
      lotId,
      status: 'ATIVO',
    },
    orderBy: {
      amount: 'desc',
    },
    select: {
      id: true,
      amount: true,
      timestamp: true,
      status: true,
      bidderDisplay: true,
    },
  });
}

/**
 * Conta o número real de lances ativos para um lote (para validar contadores).
 */
export async function countRealBidsForLot(lotId: bigint): Promise<number> {
  return prisma.bid.count({
    where: {
      lotId,
      status: 'ATIVO',
    },
  });
}

/**
 * Recupera o lance mais alto (vencedor atual) de um lote.
 */
export async function getHighestBidForLot(lotId: bigint) {
  return prisma.bid.findFirst({
    where: {
      lotId,
      status: 'ATIVO',
    },
    orderBy: {
      amount: 'desc',
    },
    select: {
      id: true,
      amount: true,
      timestamp: true,
    },
  });
}

// ─────────────────────────────────────────────────
// VERIFICAÇÃO DE INTEGRIDADE REFERENCIAL
// ─────────────────────────────────────────────────

/**
 * Verifica integridade referencial das entidades do sistema.
 */
export async function checkReferentialIntegrity(tenantId: bigint): Promise<ReferentialIntegrityReport> {
  // Leilões sem lotes
  const auctionsWithoutLots = await prisma.auction.count({
    where: {
      tenantId,
      status: { in: ['ABERTO', 'ABERTO_PARA_LANCES', 'EM_PREGAO'] },
      Lot: { none: {} },
    },
  });

  // Lotes sem leilão com status válido (leilão cancelado mas lote aberto)
  const lotsWithoutValidAuction = await prisma.lot.count({
    where: {
      tenantId,
      status: { in: ['ABERTO_PARA_LANCES', 'EM_PREGAO'] },
      Auction: {
        status: { in: ['CANCELADO', 'SUSPENSO', 'ENCERRADO'] },
      },
    },
  });

  // Lances órfãos (lote cancelado mas lance ativo)
  const orphanBids = await prisma.bid.count({
    where: {
      tenantId,
      status: 'ATIVO',
      Lot: {
        status: { in: ['CANCELADO', 'RETIRADO', 'ENCERRADO'] },
      },
    },
  });

  // Contadores desincronizados (Lot.bidsCount vs COUNT real)
  const desyncedCounters: DesyncedCounter[] = [];

  const lotsWithBids = await prisma.lot.findMany({
    where: {
      tenantId,
      status: { in: ['ABERTO_PARA_LANCES', 'EM_PREGAO'] },
    },
    select: {
      id: true,
      bidsCount: true,
      _count: {
        select: {
          Bid: {
            where: { status: 'ATIVO' } as object,
          },
        },
      },
    },
  });

  for (const lot of lotsWithBids) {
    const stored = lot.bidsCount ?? 0;
    const real = (lot._count as { Bid: number }).Bid;
    if (stored !== real) {
      desyncedCounters.push({
        entityType: 'Lot',
        entityId: String(lot.id),
        fieldName: 'bidsCount',
        storedValue: stored,
        calculatedValue: real,
      });
    }
  }

  // Verificar Auction.totalLots
  const auctionsWithLots = await prisma.auction.findMany({
    where: {
      tenantId,
      status: { in: ['ABERTO', 'ABERTO_PARA_LANCES', 'EM_PREGAO'] },
    },
    select: {
      id: true,
      totalLots: true,
      _count: {
        select: { Lot: true },
      },
    },
  });

  for (const auction of auctionsWithLots) {
    const stored = auction.totalLots;
    const real = auction._count.Lot;
    if (stored !== real) {
      desyncedCounters.push({
        entityType: 'Auction',
        entityId: String(auction.id),
        fieldName: 'totalLots',
        storedValue: stored,
        calculatedValue: real,
      });
    }
  }

  return {
    auctionsWithoutLots,
    lotsWithoutValidAuction,
    orphanBids,
    desyncedCounters,
  };
}

// ─────────────────────────────────────────────────
// GERADOR DE RELATÓRIO MARKDOWN
// ─────────────────────────────────────────────────

/**
 * Gera o relatório completo em formato Markdown.
 */
export function generateReportMarkdown(report: ReconciliationReport): string {
  const { metadata, summary, divergences, referentialIntegrity, recommendations } = report;

  const severityEmoji: Record<DivergenceSeverity, string> = {
    CRITICA: '🔴',
    ALTA: '🟠',
    MEDIA: '🟡',
    BAIXA: '🟢',
  };

  let md = `# Relatório de Reconciliação de Dados\n\n`;
  md += `**Data**: ${metadata.date}\n`;
  md += `**Ambiente**: ${metadata.environment}\n`;
  md += `**Tenant**: ${metadata.tenantSlug}\n`;
  md += `**Agente**: ${metadata.agentVersion}\n`;
  md += `**Duração**: ${(metadata.durationMs / 1000).toFixed(1)}s\n\n`;

  // Resumo Executivo
  md += `## Resumo Executivo\n\n`;
  md += `| Métrica | Valor |\n`;
  md += `|---------|-------|\n`;
  md += `| Leilões Auditados | ${summary.auctionsAudited} |\n`;
  md += `| Lotes Auditados | ${summary.lotsAudited} |\n`;
  md += `| Lances Auditados | ${summary.bidsAudited} |\n`;
  md += `| Páginas Verificadas | ${summary.pagesVerified} |\n`;
  md += `| Divergências Encontradas | ${summary.divergencesFound} |\n`;
  md += `| Divergências Críticas | ${summary.criticalDivergences} |\n`;
  md += `| Taxa de Consistência | ${summary.consistencyRate.toFixed(1)}% |\n\n`;

  // Divergências
  if (divergences.length > 0) {
    md += `## Divergências Detectadas\n\n`;
    for (const div of divergences) {
      md += `### ${severityEmoji[div.severity]} DIVERGÊNCIA #${div.id} — ${div.severity}\n\n`;
      md += `- **Entidade**: ${div.entityType} #${div.entityId} (${div.entityLabel})\n`;
      md += `- **Campo**: \`${div.fieldName}\`\n`;
      md += `- **Página**: \`${div.pageUrl}\`\n`;
      md += `- **Seletor**: \`${div.selector}\`\n`;
      md += `- **Valor DB**: ${div.dbValue}\n`;
      md += `- **Valor UI**: ${div.uiValue}\n`;
      md += `- **Delta**: ${div.delta}\n`;
      md += `- **Causa Raiz**: \`${div.rootCauseCode}\` — ${div.rootCauseDescription}\n`;
      md += `- **Recomendação**: ${div.recommendation}\n`;
      if (div.traceId) {
        md += `- **TraceId**: \`${div.traceId}\`\n`;
      }
      md += `\n`;
    }
  } else {
    md += `## Divergências Detectadas\n\nNenhuma divergência encontrada. Todos os dados estão consistentes.\n\n`;
  }

  // Integridade Referencial
  md += `## Integridade Referencial\n\n`;
  md += `| Verificação | Resultado |\n`;
  md += `|-------------|----------|\n`;
  md += `| Leilões sem Lotes (ativos) | ${referentialIntegrity.auctionsWithoutLots} |\n`;
  md += `| Lotes sem Leilão Válido | ${referentialIntegrity.lotsWithoutValidAuction} |\n`;
  md += `| Lances Órfãos | ${referentialIntegrity.orphanBids} |\n`;
  md += `| Contadores Desincronizados | ${referentialIntegrity.desyncedCounters.length} |\n\n`;

  if (referentialIntegrity.desyncedCounters.length > 0) {
    md += `### Contadores Desincronizados\n\n`;
    md += `| Entidade | ID | Campo | Armazenado | Real |\n`;
    md += `|----------|----|-------|------------|------|\n`;
    for (const c of referentialIntegrity.desyncedCounters) {
      md += `| ${c.entityType} | ${c.entityId} | ${c.fieldName} | ${c.storedValue} | ${c.calculatedValue} |\n`;
    }
    md += `\n`;
  }

  // Recomendações
  if (recommendations.length > 0) {
    md += `## Recomendações\n\n`;
    for (let i = 0; i < recommendations.length; i++) {
      md += `${i + 1}. ${recommendations[i]}\n`;
    }
    md += `\n`;
  }

  // Metadados Técnicos
  md += `## Metadados Técnicos\n\n`;
  md += `- Queries executadas: ${metadata.queriesExecuted}\n`;
  md += `- Páginas navegadas: ${metadata.pagesNavigated}\n`;
  md += `- Erros de console capturados: ${metadata.consoleErrorsCaptured}\n`;

  return md;
}

/**
 * Infere a causa raiz mais provável de uma divergência com base no tipo de campo
 * e na magnitude da diferença.
 */
export function inferRootCause(
  fieldName: string,
  dbValue: string,
  uiValue: string
): { code: RootCauseCode; description: string; recommendation: string } {

  // Valor vazio na UI -> provável falha de carregamento
  if (!uiValue || uiValue === '—' || uiValue === '-' || uiValue === 'N/A') {
    return {
      code: 'N_PLUS_1',
      description: 'Componente não carregou o dado — possível timeout ou N+1 query problem',
      recommendation: 'Verificar se o include/select do Prisma está otimizado e se há tratamento de loading state',
    };
  }

  // Casas decimais residuais na UI
  const uiNum = normalizeUICurrency(uiValue);
  if (hasResidualDecimals(uiNum)) {
    return {
      code: 'SERIAL_MISMATCH',
      description: 'Artefato de floating point na serialização BigInt/Decimal → string',
      recommendation: 'Usar toMonetaryNumber() antes de renderizar e garantir formatCurrency() centralizado',
    };
  }

  // Campo monetário com diferença
  if (fieldName.includes('price') || fieldName.includes('amount') || fieldName.includes('Price')) {
    const dbNum = normalizeDBDecimal(dbValue);
    if (Math.abs(dbNum - uiNum) > 0) {
      return {
        code: 'CACHE_NO_INVALIDATE',
        description: 'Valor monetário divergente — cache SWR ou ISR não invalidado após mutação',
        recommendation: 'Adicionar revalidatePath/revalidateTag na server action que modifica este campo',
      };
    }
  }

  // Campo de status divergente
  if (fieldName.includes('status') || fieldName.includes('Status')) {
    return {
      code: 'STALE_REACT_STATE',
      description: 'Status na UI não reflete o estado atual do banco — possível estado React obsoleto',
      recommendation: 'Verificar se useRouter().refresh() ou revalidatePath() é chamado após mudança de status',
    };
  }

  // Campo de contador divergente
  if (fieldName.includes('count') || fieldName.includes('Count') || fieldName.includes('total')) {
    return {
      code: 'MISSING_REVALIDATE',
      description: 'Contador na UI não corresponde à contagem real no banco',
      recommendation: 'Recalcular contador via COUNT real no SELECT ou trigger de atualização',
    };
  }

  // Default
  return {
    code: 'UNKNOWN',
    description: 'Causa raiz não determinada automaticamente',
    recommendation: 'Investigação manual necessária — verificar traces OpenTelemetry',
  };
}
