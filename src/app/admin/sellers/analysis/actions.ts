// src/app/admin/sellers/analysis/actions.ts
/**
 * @fileoverview Server Actions para o Dashboard de Análise de Comitentes (Vendedores).
 * Contém funções para agregar estatísticas chave de performance dos comitentes,
 * como faturamento total, taxa de vendas, e dados para gráficos. Também invoca
 * fluxos de IA para gerar análises textuais sobre os dados de desempenho.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { SellerService, type SellerDashboardData } from '@/services/seller.service';
import { analyzeAuctionData } from '@/ai/flows/analyze-auction-data-flow';
import { getSession } from '@/app/auth/actions';

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
 * Retrieves the session information and tenant ID.
 */
async function getTenantId(): Promise<string> {
    const session = await getSession();
    if (!session?.tenantId) {
        throw new Error("Tenant ID não encontrado na sessão.");
    }
    return session.tenantId;
}


/**
 * Fetches and aggregates performance data for all sellers within the current tenant.
 * @returns {Promise<SellerPerformanceData[]>} A promise that resolves to an array of seller performance objects.
 */
export async function getSellersPerformanceAction(): Promise<SellerPerformanceData[]> {
  try {
    const tenantId = await getTenantId();
    const sellers = await prisma.seller.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { auctions: true, lots: true },
        },
        lots: {
          where: { status: 'VENDIDO', tenantId },
          select: { price: true },
        },
      },
    });

    return sellers.map(seller => {
      const totalRevenue = seller.lots.reduce((acc, lot) => acc + (lot.price ? Number(lot.price) : 0), 0);
      const totalLotsSold = seller.lots.length;
      const averageTicket = totalLotsSold > 0 ? totalRevenue / totalLotsSold : 0;

      return {
        id: seller.id,
        name: seller.name,
        totalAuctions: seller._count.auctions,
        totalLots: seller._count.lots,
        totalRevenue,
        averageTicket,
      };
    });
  } catch (error: any) {
    console.error("[Action - getSellersPerformanceAction] Error fetching seller performance:", error);
    throw new Error("Falha ao buscar dados de performance dos comitentes.");
  }
}


/**
 * Fetches dashboard data for a single seller within the current tenant.
 * @param {string} sellerId - The ID of the seller.
 * @returns {Promise<SellerDashboardData | null>} The dashboard data or null if not found.
 */
export async function getSellerDashboardDataAction(sellerId: string): Promise<SellerDashboardData | null> {
    const tenantId = await getTenantId();
    return sellerService.getSellerDashboardData(tenantId, sellerId);
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
