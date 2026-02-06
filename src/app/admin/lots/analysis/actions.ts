// src/app/admin/lots/analysis/actions.ts
/**
 * @fileoverview Server Actions para o Dashboard de Análise de Lotes.
 * Este arquivo contém a lógica para buscar e agregar dados de performance
 * de todos os lotes, como contagem de lances e nomes de entidades relacionadas,
 * para serem exibidos na tabela de análise.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { Lot } from '@/types';

export interface LotPerformanceData extends Lot {
  auctionName: string;
  categoryName: string;
  sellerName: string;
  bidsCount: number;
}

/**
 * Fetches and aggregates performance data for all lots.
 * @returns {Promise<LotPerformanceData[]>} A promise that resolves to an array of lot performance objects.
 */
export async function getLotsPerformanceAction(): Promise<LotPerformanceData[]> {
  try {
    const lots = await prisma.lot.findMany({
      include: {
        Auction: { select: { title: true } },
        LotCategory: { select: { name: true } },
        Seller: { select: { name: true } },
        _count: {
          select: { Bid: true },
        },
      },
      orderBy: [
        {
          Bid: {
            _count: 'desc',
          },
        },
        {
          price: 'desc'
        }
      ]
    });

    return lots.map(lot => ({
      ...lot,
      auctionName: (lot as any).Auction?.title || 'N/A',
      categoryName: (lot as any).LotCategory?.name || 'N/A',
      sellerName: (lot as any).Seller?.name || 'N/A',
      bidsCount: (lot as any)._count.Bid,
    })) as LotPerformanceData[];
  } catch (error: any) {
    console.error("[Action - getLotsPerformanceAction] Error fetching lot performance:", error);
    throw new Error("Falha ao buscar dados de performance dos lotes.");
  }
}
