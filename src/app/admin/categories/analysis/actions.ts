// src/app/admin/categories/analysis/actions.ts
/**
 * @fileoverview Server Actions para o Dashboard de Análise de Categorias de Lotes.
 * Contém funções para agregar estatísticas chave de performance, como faturamento
 * total, número de lotes vendidos e ticket médio por categoria, permitindo uma
 * visão clara de quais categorias são mais rentáveis.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/actions/auth';

export interface CategoryPerformanceData {
  id: string;
  name: string;
  totalLotsSold: number;
  totalRevenue: number;
  averageTicket: number;
}

/**
 * Fetches and aggregates performance data for all lot categories.
 * @returns {Promise<CategoryPerformanceData[]>} A promise that resolves to an array of category performance objects.
 */
export async function getCategoriesPerformanceAction(): Promise<CategoryPerformanceData[]> {
  try {
    const tenantId = await getTenantIdFromRequest();

    const categories = await prisma.lotCategory.findMany({
      where: { tenantId: BigInt(tenantId) },
      include: {
        Lot: {
          where: { status: 'VENDIDO', tenantId: BigInt(tenantId) },
          select: { price: true },
        },
      },
    });

    return categories.map(category => {
      const totalRevenue = (category as any).Lot.reduce((acc: number, lot: any) => acc + (lot.price ? Number(lot.price) : 0), 0);
      const totalLotsSold = (category as any).Lot.length;
      const averageTicket = totalLotsSold > 0 ? totalRevenue / totalLotsSold : 0;

      return {
        id: category.id,
        name: category.name,
        totalLotsSold,
        totalRevenue,
        averageTicket,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by revenue descending
  } catch (error: any) {
    console.error("[Action - getCategoriesPerformanceAction] Error fetching category performance:", error);
    throw new Error("Falha ao buscar dados de performance das categorias.");
  }
}
