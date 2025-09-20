
// src/app/admin/lots/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Lot Analysis Dashboard.
 * Provides functions to aggregate key statistics for lot performance.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { Lot } from '@/types';

export interface LotPerformanceData extends Lot {
  auctionName: string;
  categoryName: string;
  sellerName: string;
  bidsCount: number;
}

/**
 * Fetches and aggregates performance data for all lots.
 * @returns {Promise<LotPerformanceData[]>} A promise that resolves to an array of lot performance objects.
 */
export async function getLotsPerformanceAction(): Promise<LotPerformanceData[]> {
  try {
    const lots = await prisma.lot.findMany({
      include: {
        auction: { select: { title: true } },
        category: { select: { name: true } },
        seller: { select: { name: true } },
        _count: {
          select: { bids: true },
        },
      },
      orderBy: [
        {
          bids: {
            _count: 'desc',
          },
        },
        {
          price: 'desc'
        }
      ]
    });

    return lots.map(lot => ({
      ...lot,
      auctionName: lot.auction?.title || 'N/A',
      categoryName: lot.category?.name || 'N/A',
      sellerName: lot.seller?.name || 'N/A',
      bidsCount: lot._count.bids,
    })) as LotPerformanceData[];
  } catch (error: any) {
    console.error("[Action - getLotsPerformanceAction] Error fetching lot performance:", error);
    throw new Error("Falha ao buscar dados de performance dos lotes.");
  }
}

