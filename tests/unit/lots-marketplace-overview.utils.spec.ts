/**
 * @fileoverview TDD dos sinais públicos derivados para a vitrine `/lots`.
 */

import { describe, expect, it } from 'vitest';
import { buildLotsMarketplaceSignals } from '@/app/lots/lots-marketplace-overview.utils';
import type { GroupedLots } from '@/services/lot-card-v2.service';

const groupedFixture: GroupedLots = {
  judicial: [
    {
      id: '1',
      category: 'Judicial',
      type: 'Imóvel',
      location: 'Campinas - SP',
      title: 'Apartamento judicial',
      specs: ['Ocupado'],
      processNumber: '1000000-00.2026.8.26.0001',
      stats: { visits: 12, qualified: 3, clicks: 2 },
      pricing: { minimumBid: 120000, evaluation: 180000, increment: 5000 },
      timeline: {
        stage1: { name: '1ª Praça', status: 'Aguardando', date: '01/04/2026' },
        stage2: { name: '2ª Praça', status: 'Aguardando', date: '22/04/2026' },
        timeRemaining: '3 dias',
      },
      images: ['/images/placeholder-lot.webp'],
      isLive: false,
      isOpen: true,
      comitente: { name: 'Tribunal de Justiça', logo: '/logo.png', url: '#' },
    },
  ],
  extrajudicial: [],
  vendaDireta: [
    {
      id: '2',
      category: 'Venda Direta',
      type: 'Veículo',
      location: 'Suzano - SP',
      title: 'Utilitário de frota',
      specs: ['2024/2025'],
      stats: { visits: 30, qualified: 4, clicks: 1 },
      pricing: { minimumBid: 90000, evaluation: 110000 },
      timeline: {
        stage1: { name: 'Oferta', status: 'Em Andamento', date: '02/04/2026' },
        timeRemaining: '1 dia',
      },
      images: ['/images/placeholder-lot.webp'],
      isLive: true,
      isOpen: true,
      comitente: { name: 'Rede Corporativa', logo: '/logo.png', url: '#' },
    },
  ],
  tomadaDePrecos: [],
};

describe('lots marketplace overview signals', () => {
  it('deriva contagens por modalidade e sinais de confiança da vitrine', () => {
    const result = buildLotsMarketplaceSignals(groupedFixture);

    expect(result.totalLots).toBe(2);
    expect(result.activeCategories).toBe(2);
    expect(result.openLots).toBe(2);
    expect(result.processTaggedLots).toBe(1);
    expect(result.uniqueConsignors).toBe(2);
    expect(result.modalityChips.find((chip) => chip.id === 'judicial')?.count).toBe(1);
    expect(result.modalityChips.find((chip) => chip.id === 'venda-direta')?.href).toBe('#lots-venda-direta');
    expect(result.trustSignals.find((signal) => signal.id === 'process-traceability')?.description).toContain('1 lotes');
  });
});