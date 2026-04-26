/**
 * Matriz de fontes Superbid usadas no ciclo de QA cadastral multi-modal.
 */

export type SuperbidSourceModality =
  | 'judicial'
  | 'corporate-auction'
  | 'price-taking'
  | 'market-counter';

export type BidExpertTargetModality =
  | 'JUDICIAL'
  | 'EXTRAJUDICIAL'
  | 'TOMADA_DE_PRECOS'
  | 'VENDA_DIRETA';

export interface SuperbidSourceLotSample {
  lotNumber: string;
  title: string;
  location?: string;
  category?: string;
  visiblePriceText?: string;
  statusText?: string;
}

export interface SuperbidSourceCandidate {
  id: string;
  sourceName: string;
  sourceHost: 'www.superbid.net' | 'exchange.superbid.net';
  sourceUrl: string;
  sourceModality: SuperbidSourceModality;
  bidExpertTargetModality: BidExpertTargetModality;
  title: string;
  visibleLotCount: number;
  countText: string;
  stageText: string;
  statusText: string;
  negotiationLabel: string;
  requiredComparisonFields: readonly string[];
  sampleLots: readonly SuperbidSourceLotSample[];
}

export const SUPERBID_SOURCE_MATRIX = [
  {
    id: 'superbid-judicial-falencias-sp-779463',
    sourceName: 'Superbid Exchange',
    sourceHost: 'www.superbid.net',
    sourceUrl:
      'https://www.superbid.net/evento/1-vara-de-falencias-de-recuperacoes-judiciais-sp-779463?pageNumber=1&pageSize=30&orderBy=lotNumber:asc;subLotNumber:asc',
    sourceModality: 'judicial',
    bidExpertTargetModality: 'JUDICIAL',
    title: '1a Vara de Falencias e Recuperacoes Judiciais - SP',
    visibleLotCount: 7,
    countText: '7 anuncios encontrados',
    stageText: 'Praca unica - 15/04 - 13:00',
    statusText: 'Encerrado em 15/04/2026',
    negotiationLabel: 'Judicial',
    requiredComparisonFields: [
      'modalidade',
      'processo/vara',
      'status temporal',
      'praca unica',
      'titulo do lote',
      'localizacao',
      'categoria',
      'valor exibido',
      'documentos/condicoes',
    ],
    sampleLots: [
      {
        lotNumber: '2',
        title: 'Copa E Decoracao',
        location: 'Santo Andre - SP',
        category: 'Especiais',
        visiblePriceText: 'R$ 549,90',
        statusText: 'Sustado',
      },
      {
        lotNumber: '3',
        title: 'Infraestrutura, Seguranca E Suprimentos',
        location: 'Santo Andre - SP',
        category: 'Especiais',
        visiblePriceText: 'R$ 2.838,60',
        statusText: 'Sustado',
      },
    ],
  },
  {
    id: 'superbid-corporate-amaggi-775833',
    sourceName: 'Superbid Exchange',
    sourceHost: 'exchange.superbid.net',
    sourceUrl:
      'https://exchange.superbid.net/evento/amaggi-775833?pageNumber=1&pageSize=30&orderBy=lotNumber:asc;subLotNumber:asc',
    sourceModality: 'corporate-auction',
    bidExpertTargetModality: 'EXTRAJUDICIAL',
    title: 'Amaggi',
    visibleLotCount: 195,
    countText: '195 anuncios encontrados',
    stageText: 'Praca unica - 27/04 - 11:30',
    statusText: 'Encerra em 27/04/2026',
    negotiationLabel: 'Leilao',
    requiredComparisonFields: [
      'modalidade',
      'comitente',
      'status temporal',
      'praca unica',
      'titulo do lote',
      'localizacao',
      'categoria',
      'lance atual',
      'documentos/condicoes',
    ],
    sampleLots: [],
  },
  {
    id: 'superbid-price-taking-09-grupamento-779571',
    sourceName: 'Superbid Exchange',
    sourceHost: 'exchange.superbid.net',
    sourceUrl:
      'https://exchange.superbid.net/evento/09-grupamento-logistico-ms-fase-propostas-779571?pageNumber=1&pageSize=30&orderBy=lotNumber:asc;subLotNumber:asc',
    sourceModality: 'price-taking',
    bidExpertTargetModality: 'TOMADA_DE_PRECOS',
    title: '09o Grupamento Logistico/MS - FASE PROPOSTAS',
    visibleLotCount: 39,
    countText: '39 anuncios encontrados',
    stageText: 'Fase propostas - ate 03/05',
    statusText: 'Faca sua proposta ate 03/05',
    negotiationLabel: 'Tomada de preco',
    requiredComparisonFields: [
      'modalidade',
      'orgao/comitente',
      'fase de proposta',
      'prazo de proposta',
      'titulo do item',
      'localizacao',
      'categoria',
      'valor/proposta',
      'documentos/condicoes',
    ],
    sampleLots: [],
  },
  {
    id: 'superbid-market-counter-alpek-781207',
    sourceName: 'Superbid Exchange',
    sourceHost: 'exchange.superbid.net',
    sourceUrl:
      'https://exchange.superbid.net/evento/alpek-781207?pageNumber=1&pageSize=30&orderBy=lotNumber:asc;subLotNumber:asc',
    sourceModality: 'market-counter',
    bidExpertTargetModality: 'VENDA_DIRETA',
    title: 'Alpek',
    visibleLotCount: 25,
    countText: '25 anuncios encontrados',
    stageText: 'Mercado Balcao',
    statusText: 'Registrar Proposta Vinculativa',
    negotiationLabel: 'Mercado Balcao',
    requiredComparisonFields: [
      'modalidade',
      'comitente',
      'status de venda direta',
      'titulo do item',
      'localizacao',
      'categoria',
      'valor/proposta vinculativa',
      'documentos/condicoes',
    ],
    sampleLots: [],
  },
] as const satisfies readonly SuperbidSourceCandidate[];

export const SUPERBID_EDGE_CASES = [
  {
    id: 'superbid-edge-extrajudicial-venda-particular-775674',
    sourceUrl:
      'https://exchange.superbid.net/evento/extrajudicial-venda-particular-775674?pageNumber=1&pageSize=30&orderBy=lotNumber:asc;subLotNumber:asc',
    reason:
      'A pagina descreve 61 apartamentos, mas exibe apenas 1 anuncio visivel; usar como edge case de oferta agrupada, nao como fonte primaria >5.',
  },
] as const;

export function getPrimarySuperbidSources(): readonly SuperbidSourceCandidate[] {
  return SUPERBID_SOURCE_MATRIX;
}