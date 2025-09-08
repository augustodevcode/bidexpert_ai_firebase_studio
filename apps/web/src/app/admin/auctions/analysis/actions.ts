// src/app/admin/auctions/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Auction Analysis Dashboard.
 * Provides functions to aggregate key statistics for auction performance.
 */
'use server';

import { analyzeAuctionData } from '@/ai/flows/analyze-auction-data-flow';
import { AuctionService } from '@bidexpert/services'; 
import type { AuctionPerformanceData, AuctionDashboardData } from '@bidexpert/services';

const auctionService = new AuctionService();

export type { AuctionPerformanceData, AuctionDashboardData };


/**
 * Fetches and aggregates performance data for all auctions.
 * @returns {Promise<AuctionPerformanceData[]>} A promise that resolves to an array of auction performance objects.
 */
export async function getAuctionsPerformanceAction(): Promise<AuctionPerformanceData[]> {
  try {
    return await auctionService.getAuctionsPerformance();
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
