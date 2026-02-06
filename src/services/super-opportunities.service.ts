/**
 * @fileoverview Service para buscar lotes da seção Super Oportunidades com validação completa de integridade referencial.
 * 
 * Valida a cadeia completa:
 * Leilão → Lote → Loteamento → Ativos → Cidades → Estado → Categorias
 * 
 * Regras:
 * - Apenas lotes com status ABERTO_PARA_LANCES
 * - Apenas leilões com praças cadastradas (AuctionStage)
 * - Dias para encerramento menor que o configurado
 * - Integridade referencial completa validada
 */

import { prisma } from '@/lib/prisma';
import { isPast } from 'date-fns';
import type { Lot } from '@/types';

interface SuperOpportunitiesOptions {
  maxDaysUntilClosing?: number;
  limit?: number;
  tenantId?: bigint;
}

/**
 * Busca lotes para a seção Super Oportunidades com validação completa de integridade referencial.
 * 
 * @param options - Opções de filtro
 * @returns Array de lotes validados
 */
export async function getSuperOpportunitiesLots(
  options: SuperOpportunitiesOptions = {}
): Promise<any[]> {
  const {
    maxDaysUntilClosing = 7,
    limit = 8,
    tenantId,
  } = options;

  const now = new Date();
  const maxDate = new Date(now.getTime() + maxDaysUntilClosing * 24 * 60 * 60 * 1000);

  // Buscar lotes com todas as relações necessárias
  const lotsWithRelations = await prisma.lot.findMany({
    where: {
      status: 'ABERTO_PARA_LANCES',
      ...(tenantId ? { tenantId } : {}),
      // Garantir que o lote tem auction com praças (AuctionStage)
      // Nota: Auction é relação obrigatória em Lot, não precisa de isNot: null
      Auction: {
        AuctionStage: {
          some: {},
        },
      },
      // Garantir que tem categoria (relação opcional, usar isNot corretamente)
      categoryId: { not: null },
      // Garantir que tem cidade (relação opcional)
      cityId: { not: null },
      // Garantir que tem estado (relação opcional)
      stateId: { not: null },
    },
    include: {
      Auction: {
        include: {
          AuctionStage: {
            orderBy: { endDate: 'desc' },
          },
        },
      },
      LotCategory: true,
      Subcategory: true,
      City: true,
      State: true,
      Seller: true,
      Auctioneer: true,
      AssetsOnLots: {
        include: {
          Asset: true,
        },
      },
      _count: {
        select: { Bid: true },
      },
    },
    take: limit * 2, // Buscar mais para compensar filtros
  });

  // Filtrar e validar cada lote
  const validatedLots = lotsWithRelations
    .map((lot) => {
      // Validação 1: Leilão deve existir
      if (!lot.Auction) {
        return null;
      }

      // Validação 2: Leilão deve ter pelo menos uma praça (AuctionStage)
      if (!lot.Auction.AuctionStage || lot.Auction.AuctionStage.length === 0) {
        return null;
      }

      // Validação 3: Deve ter categoria
      if (!lot.LotCategory) {
        return null;
      }

      // Validação 4: Deve ter cidade
      if (!lot.City) {
        return null;
      }

      // Validação 5: Deve ter estado
      if (!lot.State) {
        return null;
      }

      // Validação 6: Validar data de encerramento
      const lastStage = lot.Auction.AuctionStage[0];
      const relevantEndDate = lastStage?.endDate || lot.endDate;

      if (!relevantEndDate) {
        return null;
      }

      // Validação 7: Não deve ter encerrado
      if (isPast(new Date(relevantEndDate))) {
        return null;
      }

      // Validação 8: Deve estar dentro do prazo configurado
      if (new Date(relevantEndDate) > maxDate) {
        return null;
      }

      // Validação 9: Se tem loteamento (AssetsOnLots), validar ativos
      if (lot.AssetsOnLots && lot.AssetsOnLots.length > 0) {
        const hasInvalidAssets = lot.AssetsOnLots.some(
          (assetsOnLot) => !assetsOnLot.Asset
        );
        if (hasInvalidAssets) {
          return null;
        }
      }

      // Converter tipos para o formato esperado
      return {
        ...lot,
        id: lot.id.toString(),
        bidsCount: (lot as any)._count?.Bid ?? lot.bidsCount ?? 0,
        auctionId: lot.auctionId.toString(),
        categoryId: lot.categoryId?.toString() || null,
        subcategoryId: lot.subcategoryId?.toString() || null,
        sellerId: lot.sellerId?.toString() || null,
        auctioneerId: lot.auctioneerId?.toString() || null,
        cityId: lot.cityId?.toString() || null,
        stateId: lot.stateId?.toString() || null,
        winnerId: lot.winnerId?.toString() || null,
        tenantId: lot.tenantId.toString(),
        originalLotId: (lot as any).original_lot_id ? (lot as any).original_lot_id.toString() : null,
        inheritedMediaFromAssetId: null,
        price: Number(lot.price),
        initialPrice: lot.initialPrice ? Number(lot.initialPrice) : null,
        secondInitialPrice: (lot as any).secondInitialPrice ? Number((lot as any).secondInitialPrice) : null,
        bidIncrementStep: (lot as any).bidIncrementStep ? Number((lot as any).bidIncrementStep) : null,
        evaluationValue: null,
        latitude: lot.latitude !== null ? Number(lot.latitude) : null,
        longitude: lot.longitude !== null ? Number(lot.longitude) : null,
        stageDetails: [],
        endDate: relevantEndDate,
        auction: lot.Auction ? {
          ...lot.Auction,
          id: lot.Auction.id.toString(),
          tenantId: lot.Auction.tenantId.toString(),
          auctioneerId: lot.Auction.auctioneerId?.toString() || null,
          sellerId: lot.Auction.sellerId?.toString() || null,
          cityId: lot.Auction.cityId?.toString() || null,
          stateId: lot.Auction.stateId?.toString() || null,
          judicialProcessId: lot.Auction.judicialProcessId?.toString() || null,
          categoryId: (lot.Auction as any).categoryId ? (lot.Auction as any).categoryId.toString() : null,
          originalAuctionId: lot.Auction.originalAuctionId?.toString() || null,
          latitude: lot.Auction.latitude !== null ? Number(lot.Auction.latitude) : null,
          longitude: lot.Auction.longitude !== null ? Number(lot.Auction.longitude) : null,
          stages: (lot.Auction.AuctionStage || []).map((stage) => ({
            id: stage.id.toString(),
            auctionId: stage.auctionId.toString(),
            name: stage.name,
            startDate: stage.startDate,
            endDate: stage.endDate,
            initialPrice: null,
            discountPercent: (stage as any).discountPercent ? Number((stage as any).discountPercent) : 100,
            status: (stage as any).status || 'ATIVO',
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            tenantId: stage.tenantId.toString(),
          })),
        } : undefined,
      };
    })
    .filter((lot): lot is any => lot !== null)
    .slice(0, limit);

  return validatedLots as Lot[];
}
