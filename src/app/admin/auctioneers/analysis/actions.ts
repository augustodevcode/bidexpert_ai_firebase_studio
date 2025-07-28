// src/app/admin/auctioneers/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Auctioneer Analysis Dashboard.
 * Provides functions to aggregate key statistics for auctioneer performance.
 */
'use server';

import { prisma } from '@/lib/prisma';

export interface AuctioneerPerformanceData {
  id: string;
  name: string;
  totalAuctions: number;
  totalLots: number;
  lotsSoldCount: number;
  totalRevenue: number;
  averageTicket: number;
  salesRate: number;
}

/**
 * Fetches and aggregates performance data for all auctioneers.
 * @returns {Promise<AuctioneerPerformanceData[]>} A promise that resolves to an array of auctioneer performance objects.
 */
export async function getAuctioneersPerformanceAction(): Promise<AuctioneerPerformanceData[]> {
  try {
    const auctioneers = await prisma.auctioneer.findMany({
      include: {
        _count: {
          select: { auctions: true },
        },
        auctions: {
          include: {
            lots: {
              where: { status: 'VENDIDO' },
              select: { price: true },
            },
            _count: {
              select: { lots: true },
            },
          },
        },
      },
    });

    return auctioneers.map(auctioneer => {
      const allLotsFromAuctions = auctioneer.auctions.flatMap(auc => auc.lots);
      const totalRevenue = allLotsFromAuctions.reduce((acc, lot) => acc + (lot.price || 0), 0);
      const lotsSoldCount = allLotsFromAuctions.length;
      const totalLotsInAuctions = auctioneer.auctions.reduce((acc, auc) => acc + auc._count.lots, 0);
      const averageTicket = lotsSoldCount > 0 ? totalRevenue / lotsSoldCount : 0;
      const salesRate = totalLotsInAuctions > 0 ? (lotsSoldCount / totalLotsInAuctions) * 100 : 0;

      return {
        id: auctioneer.id,
        name: auctioneer.name,
        totalAuctions: auctioneer._count.auctions,
        totalLots: totalLotsInAuctions,
        lotsSoldCount,
        totalRevenue,
        averageTicket,
        salesRate,
      };
    });
  } catch (error: any) {
    console.error("[Action - getAuctioneersPerformanceAction] Error fetching auctioneer performance:", error);
    throw new Error("Falha ao buscar dados de performance dos leiloeiros.");
  }
}
