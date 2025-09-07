// src/app/admin/auctions/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Auction Analysis Dashboard.
 * Provides functions to aggregate key statistics for auction performance.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { AuctionPerformanceData, AuctionDashboardData } from '@/types';
import { analyzeAuctionData } from '@/ai/flows/analyze-auction-data-flow';
import { AuctionService } from '@bidexpert/services'; 

const auctionService = new AuctionService();

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
        stages: true, // Corrigido de auctionStages para stages
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
        auctionDate: auction.auctionDate,
        auctionStages: auction.stages, 
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
    return auctionService.getAuctionDashboardData(auctionId);
}


/**
 * Sends auction performance data to an AI flow for analysis.
 * @param {object} input - The performance data to be analyzed.
 * @returns {Promise<string>} A promise resolving to the AI-generated analysis text.
 */
export async function analyzeAuctionDataAction(input: { performanceData: any[] }): Promise<string> {
    try {
        const analysis = await analyzeAuctionData(input);
        return analysis.analysis;
    } catch (error: any) {
        console.error("[Action - analyzeAuctionDataAction] Error calling AI flow:", error);
        throw new Error("Falha ao gerar análise de IA.");
    }
}
