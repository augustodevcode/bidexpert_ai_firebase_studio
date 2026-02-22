/**
 * @fileoverview Mapeamento de endpoints e seletores data-ai-id para
 * navegação automatizada do agente de reconciliação.
 *
 * Cada entrada define:
 * - A rota/URL a navegar
 * - Os seletores data-ai-id esperados na página
 * - O tipo de entidade associada
 * - Os campos extraídos de cada seletor
 *
 * Este mapa é consumido pelo background audit script para saber
 * ONDE navegar e O QUE extrair.
 */

export interface SelectorMapping {
  /** Seletor CSS baseado em data-ai-id */
  selector: string;
  /** Nome do campo no banco que este seletor exibe */
  dbFieldName: string;
  /** Tipo de dado para normalização */
  fieldType: 'currency' | 'status' | 'counter' | 'text' | 'date' | 'percentage';
}

export interface PageEndpoint {
  /** Nome legível da página */
  name: string;
  /** Template de URL (substituir {slug}, {id}, {publicId}) */
  urlTemplate: string;
  /** Tipo de entidade principal da página */
  entityType: 'Auction' | 'Lot' | 'Bid' | 'UserWin';
  /** Seletores a extrair nesta página */
  selectors: SelectorMapping[];
}

// ─────────────────────────────────────────────────
// MAPEAMENTO DE PÁGINAS E SELETORES
// ─────────────────────────────────────────────────

export const PAGE_ENDPOINTS: PageEndpoint[] = [
  // ─── HOME / Super Oportunidades ───
  {
    name: 'Home — Super Oportunidades',
    urlTemplate: '/search',
    entityType: 'Lot',
    selectors: [
      {
        selector: '[data-ai-id="super-opportunities-section"]',
        dbFieldName: 'exists',
        fieldType: 'text',
      },
      {
        selector: '[data-ai-id^="lot-card-"]',
        dbFieldName: 'id',
        fieldType: 'text',
      },
    ],
  },

  // ─── Página de Leilão ───
  {
    name: 'Detalhe do Leilão',
    urlTemplate: '/auction/{slug}',
    entityType: 'Auction',
    selectors: [
      {
        selector: '[data-ai-id="auction-title"]',
        dbFieldName: 'title',
        fieldType: 'text',
      },
      {
        selector: '[data-ai-id="auction-status-badge"]',
        dbFieldName: 'status',
        fieldType: 'status',
      },
      {
        selector: '[data-ai-id="auction-total-lots"]',
        dbFieldName: 'totalLots',
        fieldType: 'counter',
      },
      {
        selector: '[data-ai-id="auction-date"]',
        dbFieldName: 'auctionDate',
        fieldType: 'date',
      },
      {
        selector: '[data-ai-id="auction-initial-offer"]',
        dbFieldName: 'initialOffer',
        fieldType: 'currency',
      },
      {
        selector: '[data-ai-id="auction-contact-info-card"]',
        dbFieldName: '_metadata',
        fieldType: 'text',
      },
    ],
  },

  // ─── Página de Lote (detalhe) ───
  {
    name: 'Detalhe do Lote',
    urlTemplate: '/auction/{auctionSlug}/lot/{lotSlug}',
    entityType: 'Lot',
    selectors: [
      {
        selector: '[data-ai-id="lot-title"]',
        dbFieldName: 'title',
        fieldType: 'text',
      },
      {
        selector: '[data-ai-id="lot-current-price"]',
        dbFieldName: 'price',
        fieldType: 'currency',
      },
      {
        selector: '[data-ai-id="lot-initial-price"]',
        dbFieldName: 'initialPrice',
        fieldType: 'currency',
      },
      {
        selector: '[data-ai-id="lot-status-badge"]',
        dbFieldName: 'status',
        fieldType: 'status',
      },
      {
        selector: '[data-ai-id="lot-bids-count"]',
        dbFieldName: 'bidsCount',
        fieldType: 'counter',
      },
      {
        selector: '[data-ai-id="lot-end-date"]',
        dbFieldName: 'endDate',
        fieldType: 'date',
      },
      {
        selector: '[data-ai-id="lot-discount-badge"]',
        dbFieldName: '_calculated_discount',
        fieldType: 'percentage',
      },
    ],
  },

  // ─── Painel de Lances do Lote ───
  {
    name: 'Painel de Lances',
    urlTemplate: '/auction/{auctionSlug}/lot/{lotSlug}#bids',
    entityType: 'Bid',
    selectors: [
      {
        selector: '[data-ai-id="bid-highest-amount"]',
        dbFieldName: 'amount',
        fieldType: 'currency',
      },
      {
        selector: '[data-ai-id="bid-history-list"]',
        dbFieldName: '_collection',
        fieldType: 'text',
      },
      {
        selector: '[data-ai-id^="bid-item-"]',
        dbFieldName: 'amount',
        fieldType: 'currency',
      },
    ],
  },

  // ─── Página de Resultados / Busca ───
  {
    name: 'Página de Busca',
    urlTemplate: '/search?status=ABERTO_PARA_LANCES',
    entityType: 'Lot',
    selectors: [
      {
        selector: '[data-ai-id="search-results-count"]',
        dbFieldName: '_count',
        fieldType: 'counter',
      },
      {
        selector: '[data-ai-id^="lot-card-"]',
        dbFieldName: 'id',
        fieldType: 'text',
      },
    ],
  },

  // ─── Dashboard Admin ───
  {
    name: 'Dashboard Administrativo',
    urlTemplate: '/admin/dashboard',
    entityType: 'Auction',
    selectors: [
      {
        selector: '[data-ai-id="dashboard-active-auctions"]',
        dbFieldName: '_count_active',
        fieldType: 'counter',
      },
      {
        selector: '[data-ai-id="dashboard-total-bids"]',
        dbFieldName: '_count_bids',
        fieldType: 'counter',
      },
      {
        selector: '[data-ai-id="dashboard-revenue"]',
        dbFieldName: 'achievedRevenue',
        fieldType: 'currency',
      },
    ],
  },

  // ─── Lista de Leilões Admin ───
  {
    name: 'Lista de Leilões (Admin)',
    urlTemplate: '/admin/auctions',
    entityType: 'Auction',
    selectors: [
      {
        selector: '[data-ai-id="admin-auctions-table"]',
        dbFieldName: '_collection',
        fieldType: 'text',
      },
      {
        selector: '[data-ai-id^="auction-row-"]',
        dbFieldName: 'id',
        fieldType: 'text',
      },
    ],
  },

  // ─── Arrematações (Público) ───
  {
    name: 'Lotes Arrematados',
    urlTemplate: '/search?status=VENDIDO',
    entityType: 'Lot',
    selectors: [
      {
        selector: '[data-ai-id="sold-lots-count"]',
        dbFieldName: '_count',
        fieldType: 'counter',
      },
      {
        selector: '[data-ai-id^="lot-card-"]',
        dbFieldName: 'soldPrice',
        fieldType: 'currency',
      },
    ],
  },
];

// ─────────────────────────────────────────────────
// HELPERS DE URL
// ─────────────────────────────────────────────────

/**
 * Gera a URL real a partir do template, substituindo placeholders.
 */
export function resolveUrl(
  template: string,
  params: Record<string, string>,
  baseUrl: string = 'http://demo.localhost:9005'
): string {
  let url = template;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`{${key}}`, value);
  }
  return `${baseUrl}${url}`;
}

/**
 * Retorna os endpoints apropriados para uma entidade específica.
 */
export function getEndpointsForEntity(entityType: 'Auction' | 'Lot' | 'Bid' | 'UserWin'): PageEndpoint[] {
  return PAGE_ENDPOINTS.filter((ep) => ep.entityType === entityType);
}
