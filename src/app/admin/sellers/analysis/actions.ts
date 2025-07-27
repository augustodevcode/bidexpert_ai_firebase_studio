// src/app/admin/sellers/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Seller Analysis Dashboard.
 * Provides functions to aggregate key statistics for seller performance.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { SellerProfileInfo } from '@/types';

export interface SellerPerformanceData {
  id: string;
  name: string;
  totalAuctions: number;
  totalLots: number;
  totalRevenue: number;
  averageTicket: number;
}

/**
 * Fetches and aggregates performance data for all sellers.
 * @returns {Promise<SellerPerformanceData[]>} A promise that resolves to an array of seller performance objects.
 */
export async function getSellersPerformanceAction(): Promise<SellerPerformanceData[]> {
  try {
    const sellers = await prisma.seller.findMany({
      include: {
        _count: {
          select: { auctions: true, lots: true },
        },
        lots: {
          where: { status: 'VENDIDO' },
          select: { price: true },
        },
      },
    });

    return sellers.map(seller => {
      const totalRevenue = seller.lots.reduce((acc, lot) => acc + (lot.price || 0), 0);
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
