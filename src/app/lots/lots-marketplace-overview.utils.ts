/**
 * @fileoverview Helpers para derivar sinais públicos de taxonomia e confiança da vitrine `/lots`.
 */

import type { GroupedLots } from '@/services/lot-card-v2.service';

type ModalityKey = 'judicial' | 'extrajudicial' | 'venda-direta' | 'tomada-de-precos';

export interface LotsMarketplaceModalityChip {
  id: ModalityKey;
  label: string;
  count: number;
  description: string;
  href: string;
}

export interface LotsMarketplaceTrustSignal {
  id: 'open-lots' | 'process-traceability' | 'active-consignors' | 'advanced-discovery';
  title: string;
  description: string;
  href: string;
}

export interface LotsMarketplaceSignals {
  totalLots: number;
  activeCategories: number;
  openLots: number;
  processTaggedLots: number;
  uniqueConsignors: number;
  modalityChips: LotsMarketplaceModalityChip[];
  trustSignals: LotsMarketplaceTrustSignal[];
}

const MODALITY_CONFIG: Array<{
  id: ModalityKey;
  label: string;
  description: string;
}> = [
  {
    id: 'judicial',
    label: 'Judicial',
    description: 'Praças, processo e cronograma público para decisões com lastro jurídico.',
  },
  {
    id: 'extrajudicial',
    label: 'Extrajudicial',
    description: 'Oportunidades estruturadas fora do rito judicial, com disputa e cronograma claros.',
  },
  {
    id: 'venda-direta',
    label: 'Venda Direta',
    description: 'Compra imediata com preço objetivo e leitura rápida de valor.',
  },
  {
    id: 'tomada-de-precos',
    label: 'Tomada de Preços',
    description: 'Propostas vinculantes em janela definida, com foco em decisão comparativa.',
  },
];

export function buildLotsMarketplaceSignals(grouped: GroupedLots): LotsMarketplaceSignals {
  const modalityCounts = {
    judicial: grouped.judicial.length,
    extrajudicial: grouped.extrajudicial.length,
    'venda-direta': grouped.vendaDireta.length,
    'tomada-de-precos': grouped.tomadaDePrecos.length,
  } as const;

  const allItems = [
    ...grouped.judicial,
    ...grouped.extrajudicial,
    ...grouped.vendaDireta,
    ...grouped.tomadaDePrecos,
  ];

  const openLots = allItems.filter((item) => item.isOpen || item.isLive).length;
  const processTaggedLots = allItems.filter((item) => Boolean(item.processNumber)).length;
  const uniqueConsignors = new Set(
    allItems
      .map((item) => item.comitente?.name?.trim())
      .filter((value): value is string => Boolean(value)),
  ).size;

  return {
    totalLots: allItems.length,
    activeCategories: Object.values(modalityCounts).filter((count) => count > 0).length,
    openLots,
    processTaggedLots,
    uniqueConsignors,
    modalityChips: MODALITY_CONFIG.map((config) => ({
      ...config,
      count: modalityCounts[config.id],
      href: `#lots-${config.id}`,
    })),
    trustSignals: [
      {
        id: 'open-lots',
        title: 'Oportunidades em disputa',
        description:
          openLots > 0
            ? `${openLots} lotes em janela ativa para lance, proposta ou compra.`
            : 'Acompanhe a vitrine para novas janelas ativas de disputa e proposta.',
        href: '#lots-judicial',
      },
      {
        id: 'process-traceability',
        title: 'Rastreabilidade jurídica',
        description:
          processTaggedLots > 0
            ? `${processTaggedLots} lotes exibem referência processual visível para análise inicial.`
            : 'Quando aplicável, a vitrine destaca processos e documentação para leitura segura.',
        href: '/auction-safety-tips',
      },
      {
        id: 'active-consignors',
        title: 'Comitentes ativos',
        description:
          uniqueConsignors > 0
            ? `${uniqueConsignors} comitentes estão representados nesta seleção pública.`
            : 'Acompanhe diferentes comitentes e origens de oportunidade na vitrine pública.',
        href: '/sell-with-us',
      },
      {
        id: 'advanced-discovery',
        title: 'Busca aprofundada',
        description: 'Refine por modalidade, categoria, localidade e preço na busca completa.',
        href: '/search?type=lots',
      },
    ],
  };
}