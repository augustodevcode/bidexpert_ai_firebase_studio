// src/app/admin/sellers/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Seller Analysis Dashboard.
 * Provides functions to aggregate key statistics for seller performance.
 */
'use server';

import { SellerService } from '@bidexpert/services';
import { analyzeAuctionData } from '@/ai/flows/analyze-auction-data-flow';
import type { SellerDashboardData } from '@bidexpert/core';

export interface SellerPerformanceData {
  id: string;
  name: string;
  totalAuctions: number;
  totalLots: number;
  totalRevenue: number;
  averageTicket: number;
}
const sellerService = new SellerService();

/**
 * Fetches and aggregates performance data for all sellers.
 * @returns {Promise<SellerPerformanceData[]>} A promise that resolves to an array of seller performance objects.
 */
export async function getSellersPerformanceAction(): Promise<SellerPerformanceData[]> {
    try {
        // A lógica de agregação foi movida para o SellerService
        // @ts-ignore
        return await sellerService.getSellersPerformance();
    } catch (error: any) {
        console.error("[Action - getSellersPerformanceAction] Error fetching seller performance:", error);
        throw new Error("Falha ao buscar dados de performance dos comitentes.");
    }
}


/**
 * Fetches dashboard data for a single seller.
 * @param {string} sellerId - The ID of the seller.
 * @returns {Promise<SellerDashboardData | null>} The dashboard data or null if not found.
 */
export async function getSellerDashboardDataAction(sellerId: string): Promise<SellerDashboardData | null> {
    return sellerService.getSellerDashboardData(sellerId);
}


/**
 * Sends seller performance data to an AI flow for analysis.
 * @param {object} input - The performance data to be analyzed.
 * @returns {Promise<string>} A promise resolving to the AI-generated analysis text.
 */
export async function analyzeSellerDataAction(input: { performanceData: any[] }): Promise<string> {
    try {
        const analysis = await analyzeAuctionData(input);
        return analysis.analysis;
    } catch (error: any) {
        console.error("[Action - analyzeSellerDataAction] Error calling AI flow:", error);
        throw new Error("Falha ao gerar análise de IA para comitentes.");
    }
}
