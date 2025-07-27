// src/app/admin/auctions/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Auction Analysis Dashboard.
 * Provides functions to aggregate key statistics for auction performance.
 */
'use server';

import { prisma } from '@/lib/prisma';

export interface AuctionPerformanceData {
  id: string;
  title: string;
  status: string;
  totalLots: number;
  lotsSoldCount: number;
  totalRevenue: number;
  averageTicket: number;
  salesRate: number;
}

/**
 * Fetches and aggregates performance data for all auctions.
 * @returns {Promise<AuctionPerformanceData[]>} A promise that resolves to an array of auction performance objects.
 */
export async function getAuctionsPerformanceAction(): Promise<AuctionPerformanceData[]> {
  try {
    const auctions = await prisma.auction.findMany({
      include: {
        _count: {
          select: { lots: true },
        },
        lots: {
          where: { status: 'VENDIDO' },
          select: { price: true },
        },
      },
    });

    return auctions.map(auction => {
      const totalRevenue = auction.lots.reduce((acc, lot) => acc + (lot.price || 0), 0);
      const lotsSoldCount = auction.lots.length;
      const totalLots = auction._count.lots;
      const averageTicket = lotsSoldCount > 0 ? totalRevenue / lotsSoldCount : 0;
      const salesRate = totalLots > 0 ? (lotsSoldCount / totalLots) * 100 : 0;

      return {
        id: auction.id,
        title: auction.title,
        status: auction.status,
        totalLots,
        lotsSoldCount,
        totalRevenue,
        averageTicket,
        salesRate,
      };
    });
  } catch (error: any) {
    console.error("[Action - getAuctionsPerformanceAction] Error fetching auction performance:", error);
    throw new Error("Falha ao buscar dados de performance dos leilões.");
  }
}
