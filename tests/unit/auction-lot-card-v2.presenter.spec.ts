/**
 * @fileoverview TDD do presenter compartilhado do card universal de lotes.
 */

import { describe, expect, it } from 'vitest';
import type { Auction, PlatformSettings } from '@/types';
import { buildAuctionLotCardV2Item } from '@/components/cards/auction-lot-card-v2.presenter';

const now = Date.now();

const platformSettings = {
  showCountdownOnCards: true,
  mentalTriggerSettings: {
    showPopularityBadge: true,
    popularityViewThreshold: 500,
    showHotBidBadge: true,
    hotBidThreshold: 10,
    showExclusiveBadge: true,
  },
  sectionBadgeVisibility: {
    searchGrid: {
      showPopularityBadge: true,
      showHotBidBadge: true,
      showExclusiveBadge: true,
      showDiscountBadge: true,
      showStatusBadge: true,
      showUrgencyTimer: true,
    },
  },
} as unknown as PlatformSettings;

const auction = {
  id: '201',
  publicId: 'AUC-201',
  status: 'ABERTO_PARA_LANCES',
  auctionType: 'EXTRAJUDICIAL',
  totalHabilitatedUsers: 12,
  seller: {
    id: '301',
    name: 'Comitente XPTO',
    slug: 'comitente-xpto',
    logoUrl: '/logo-comitente.webp',
  },
  auctionStages: [
    {
      id: 'stage-1',
      name: '1ª Praça',
      status: 'ENCERRADO',
      startDate: new Date(now - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now - 5 * 24 * 60 * 60 * 1000),
      discountPercent: 100,
    },
    {
      id: 'stage-2',
      name: '2ª Praça',
      status: 'ABERTO_PARA_LANCES',
      startDate: new Date(now - 60 * 60 * 1000),
      endDate: new Date(now + 3 * 24 * 60 * 60 * 1000),
      discountPercent: 50,
    },
  ],
} as unknown as Auction;

describe('buildAuctionLotCardV2Item', () => {
  it('preserva pricing por praça, contexto de rota e badges mentais do card legado', () => {
    const lot = {
      id: '101',
      publicId: 'LOT-101',
      auctionId: '201',
      title: 'Apartamento com varanda gourmet',
      type: 'Imóvel',
      status: 'ABERTO_PARA_LANCES',
      price: 50000,
      initialPrice: 100000,
      bidIncrementStep: 5000,
      evaluationValue: 200000,
      bidsCount: 0,
      views: 950,
      isExclusive: true,
      additionalTriggers: ['DESTAQUE'],
      cityName: 'Campinas',
      stateUf: 'SP',
      imageUrl: '/lote-101.webp',
      galleryImageUrls: ['/lote-101.webp', '/lote-101-alt.webp'],
    } as any;

    const result = buildAuctionLotCardV2Item({
      lot,
      auction,
      platformSettings,
      showCountdown: true,
    });

    expect(result.displayPriceLabel).toBe('Lance Mínimo');
    expect(result.pricing.minimumBid).toBe(50000);
    expect(result.pricing.increment).toBe(5000);
    expect(result.detailUrl).toBe('/auctions/AUC-201/lots/LOT-101');
    expect(result.statusTone).toBe('open');
    expect(result.mentalTriggers).toEqual(expect.arrayContaining(['DESTAQUE', 'MAIS VISITADO', 'EXCLUSIVO']));
    expect(result.showOpportunityBadge).toBe(true);
    expect(result.comitente?.url).toBe('/sellers/comitente-xpto');
    expect(result.images).toEqual(['/lote-101.webp', '/lote-101-alt.webp']);
  });

  it('troca para lance atual quando o lote já possui lances e mantém o source context', () => {
    const lot = {
      id: '102',
      auctionId: '201',
      title: 'SUV blindada',
      type: 'Veículo',
      status: 'EM_PREGAO',
      price: 185000,
      initialPrice: 150000,
      bidIncrementStep: 10000,
      evaluationValue: 250000,
      bidsCount: 4,
      views: 40,
      isExclusive: false,
      cityName: 'São Paulo',
      stateUf: 'SP',
    } as any;

    const result = buildAuctionLotCardV2Item({
      lot,
      auction,
      platformSettings,
      showCountdown: false,
    });

    expect(result.displayPriceLabel).toBe('Lance Atual');
    expect(result.pricing.minimumBid).toBe(185000);
    expect(result.isLive).toBe(true);
    expect(result.sourceLot?.title).toBe('SUV blindada');
    expect(result.sourceAuction?.id).toBe('201');
    expect(result.showCountdown).toBe(false);
  });
});