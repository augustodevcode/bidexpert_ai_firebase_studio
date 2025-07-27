// src/app/admin/auctions/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Auction Analysis Dashboard.
 * Provides functions to aggregate key statistics for auction performance.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { AuctionPerformanceData, AuctionDashboardData } from '@/types';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

/**
 * Fetches and aggregates performance data for a single auction.
 * @param {string} auctionId - The ID of the auction.
 * @returns {Promise<AuctionDashboardData | null>} A promise resolving to the dashboard data or null if not found.
 */
export async function getAuctionDashboardDataAction(auctionId: string): Promise<AuctionDashboardData | null> {
    try {
        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            include: {
                lots: {
                    include: {
                        bids: {
                            orderBy: { timestamp: 'asc' }
                        },
                        category: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        if (!auction) {
            return null;
        }

        const soldLots = auction.lots.filter(lot => lot.status === 'VENDIDO');
        const totalRevenue = soldLots.reduce((acc, lot) => acc + (lot.price || 0), 0);
        const totalBids = auction.lots.reduce((acc, lot) => acc + lot.bids.length, 0);
        const uniqueBidders = new Set(auction.lots.flatMap(lot => lot.bids.map(bid => bid.bidderId))).size;
        const salesRate = auction.lots.length > 0 ? (soldLots.length / auction.lots.length) * 100 : 0;

        // Revenue by Category
        const revenueByCategoryMap = new Map<string, number>();
        soldLots.forEach(lot => {
            const categoryName = lot.category?.name || 'Sem Categoria';
            const currentRevenue = revenueByCategoryMap.get(categoryName) || 0;
            revenueByCategoryMap.set(categoryName, currentRevenue + (lot.price || 0));
        });
        const revenueByCategory = Array.from(revenueByCategoryMap, ([name, Faturamento]) => ({ name, Faturamento }))
            .sort((a,b) => b.Faturamento - a.Faturamento);

        // Bids over Time
        const bidsOverTimeMap = new Map<string, number>();
        const allBids = auction.lots.flatMap(lot => lot.bids);
        allBids.forEach(bid => {
            const dayKey = format(new Date(bid.timestamp), 'dd/MM', { locale: ptBR });
            bidsOverTimeMap.set(dayKey, (bidsOverTimeMap.get(dayKey) || 0) + 1);
        });
        const bidsOverTime = Array.from(bidsOverTimeMap, ([name, Lances]) => ({ name, Lances }))
             .sort((a, b) => new Date(a.name.split('/').reverse().join('-')).getTime() - new Date(b.name.split('/').reverse().join('-')).getTime());


        return {
            totalRevenue,
            totalBids,
            uniqueBidders,
            salesRate,
            revenueByCategory,
            bidsOverTime,
        };

    } catch (error: any) {
        console.error(`[Action - getAuctionDashboardDataAction] Error fetching dashboard data for auction ${auctionId}:`, error);
        throw new Error("Falha ao buscar dados de performance do leilão.");
    }
}
