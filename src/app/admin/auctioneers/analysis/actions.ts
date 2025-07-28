// src/app/admin/auctioneers/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Auctioneer Analysis Dashboard.
 * Provides functions to aggregate key statistics for auctioneer performance.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { analyzeAuctionData } from '@/ai/flows/analyze-auction-data-flow';
import type { AnalyzeAuctionDataInput } from '@/ai/flows/analyze-auction-data-flow';

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

/**
 * Sends auctioneer performance data to an AI flow for analysis.
 * @param {AnalyzeAuctionDataInput} input - The performance data to be analyzed.
 * @returns {Promise<string>} A promise resolving to the AI-generated analysis text.
 */
export async function analyzeAuctioneerDataAction(input: AnalyzeAuctionDataInput): Promise<string> {
    try {
        const analysis = await analyzeAuctionData(input);
        return analysis.analysis;
    } catch (error: any) {
        console.error("[Action - analyzeAuctioneerDataAction] Error calling AI flow:", error);
        throw new Error("Falha ao gerar análise de IA para leiloeiros.");
    }
}
