/**
 * @fileoverview Testes unitários para o cálculo de inconsistências de auditoria.
 * BDD: Garantir que cruzamentos críticos retornem inconsistências esperadas.
 * TDD: Validar contagens e filtros de dados incompletos.
 */

import { describe, it, expect } from 'vitest';
import { buildAuditData, type AuditSourceData } from '../../../src/app/admin/reports/audit/audit-utils';

const buildSource = (overrides: Partial<AuditSourceData> = {}): AuditSourceData => ({
  auctions: [],
  lots: [],
  assets: [],
  directSales: [],
  users: [],
  sellers: [],
  ...overrides,
});

describe('buildAuditData', () => {
  it('identifica leilões publicados sem responsáveis e sem agenda', () => {
    const source = buildSource({
      auctions: [
        {
          id: BigInt(1),
          title: 'Leilão sem responsáveis',
          status: 'ABERTO',
          publicId: 'AUC-1',
          sellerId: null,
          auctioneerId: null,
          auctionDate: null,
          endDate: null,
          cityId: null,
          stateId: null,
          zipCode: null,
          street: null,
          auctionType: 'EXTRAJUDICIAL',
          judicialProcessId: null,
          _count: { lots: 1, stages: 0 },
          lots: [],
          stages: [],
        } as AuditSourceData['auctions'][0],
      ],
    });

    const result = buildAuditData(source);

    expect(result.auctionsMissingResponsibleParties).toHaveLength(1);
    expect(result.auctionsMissingSchedule).toHaveLength(1);
  });

  it('marca lotes vendidos sem arrematante', () => {
    const source = buildSource({
      lots: [
        {
          id: BigInt(10),
          title: 'Lote vendido',
          status: 'VENDIDO',
          publicId: 'LOT-10',
          auctionId: BigInt(1),
          winnerId: null,
          cityId: null,
          stateId: null,
          cityName: null,
          stateUf: null,
          imageUrl: 'https://image',
          imageMediaId: null,
          galleryImageUrls: null,
          mediaItemIds: null,
          _count: { assets: 1, bids: 2, questions: 1, reviews: 1, lotPrices: 1 },
        } as AuditSourceData['lots'][0],
      ],
    });

    const result = buildAuditData(source);

    expect(result.lotsSoldWithoutWinner).toHaveLength(1);
  });

  it('detecta ativos e vendas diretas sem mídia e localização', () => {
    const source = buildSource({
      assets: [
        {
          id: BigInt(5),
          title: 'Ativo sem mídia',
          status: 'DISPONIVEL',
          publicId: 'AST-5',
          categoryId: null,
          sellerId: null,
          address: null,
          locationCity: null,
          locationState: null,
          latitude: null,
          longitude: null,
          imageUrl: null,
          imageMediaId: null,
          galleryImageUrls: null,
          mediaItemIds: null,
          _count: { lots: 0 },
        } as AuditSourceData['assets'][0],
      ],
      directSales: [
        {
          id: BigInt(20),
          title: 'Venda direta sem dados',
          status: 'ACTIVE',
          publicId: 'DS-20',
          offerType: 'BUY_NOW',
          price: null,
          minimumOfferPrice: null,
          sellerId: BigInt(3),
          categoryId: BigInt(4),
          locationCity: null,
          locationState: null,
          imageUrl: null,
          imageMediaId: null,
          galleryImageUrls: null,
          mediaItemIds: null,
        } as AuditSourceData['directSales'][0],
      ],
    });

    const result = buildAuditData(source);

    expect(result.assetsWithoutImages).toHaveLength(1);
    expect(result.assetsWithoutLocation).toHaveLength(1);
    expect(result.directSalesWithMissingData).toHaveLength(1);
    expect(result.directSalesWithoutImages).toHaveLength(1);
    expect(result.directSalesWithoutLocation).toHaveLength(1);
  });
});
