// src/app/admin/auctioneers/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Auctioneer Analysis Dashboard.
 * Provides functions to aggregate key statistics for auctioneer performance.
 */
'use server';

import { analyzeAuctionData } from '@/ai/flows/analyze-auction-data-flow';
import { AuctioneerService, type AuctioneerDashboardData } from '@/services/auctioneer.service';
import { getSession } from '@/app/auth/actions';

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
const auctioneerService = new AuctioneerService();

/**
 * Retrieves session information and tenant ID.
 */
async function getTenantId(): Promise<string> {
    const session = await getSession();
    if (!session?.tenantId) {
        throw new Error("Tenant ID não encontrado na sessão.");
    }
    return session.tenantId;
}


/**
 * Fetches and aggregates performance data for all auctioneers within the current tenant.
 * @returns {Promise<AuctioneerPerformanceData[]>} A promise that resolves to an array of auctioneer performance objects.
 */
export async function getAuctioneersPerformanceAction(): Promise<AuctioneerPerformanceData[]> {
  try {
    const tenantId = await getTenantId();
    return auctioneerService.getAuctioneersPerformance(tenantId);
  } catch (error: any) {
    console.error("[Action - getAuctioneersPerformanceAction] Error fetching auctioneer performance:", error);
    throw new Error("Falha ao buscar dados de performance dos leiloeiros.");
  }
}

/**
 * Fetches dashboard data for a single auctioneer within the current tenant.
 * @param {string} auctioneerId - The ID of the auctioneer.
 * @returns {Promise<AuctioneerDashboardData | null>} The dashboard data or null if not found.
 */
export async function getAuctioneerDashboardDataAction(auctioneerId: string): Promise<AuctioneerDashboardData | null> {
    const tenantId = await getTenantId();
    return auctioneerService.getAuctioneerDashboardData(tenantId, auctioneerId);
}


/**
 * Sends auctioneer performance data to an AI flow for analysis.
 * @param {object} input - The performance data to be analyzed.
 * @returns {Promise<string>} A promise resolving to the AI-generated analysis text.
 */
export async function analyzeAuctioneerDataAction(input: { performanceData: any[] }): Promise<string> {
    try {
        const analysis = await analyzeAuctionData(input);
        return analysis.analysis;
    } catch (error: any) {
        console.error("[Action - analyzeAuctioneerDataAction] Error calling AI flow:", error);
        throw new Error("Falha ao gerar análise de IA para leiloeiros.");
    }
}
