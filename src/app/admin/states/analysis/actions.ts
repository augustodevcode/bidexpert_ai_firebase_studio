// src/app/admin/states/analysis/actions.ts
/**
 * @fileoverview Server Actions para o Dashboard de Análise de Estados.
 * Contém funções para agregar estatísticas chave de performance por estado,
 * como faturamento total, número de lotes vendidos, taxa de venda e identificação
 * das cidades e categorias de maior destaque dentro de cada estado.
 */
'use server';

import { prisma } from '@/lib/prisma';

export interface StatePerformanceData {
  id: string;
  name: string;
  uf: string;
  totalLots: number;
  lotsSoldCount: number;
  totalRevenue: number;
  salesRate: number;
  cityWithHighestRevenue: string;
  mostValuableCategory: string;
}

/**
 * Fetches and aggregates performance data for all states with lots.
 * @returns {Promise<StatePerformanceData[]>} A promise that resolves to an array of state performance objects.
 */
export async function getStatesPerformanceAction(): Promise<StatePerformanceData[]> {
  try {
    const statesWithLots = await prisma.state.findMany({
      where: {
        Lot: {
          some: {}, // Ensure the state has at least one lot
        },
      },
      include: {
        Lot: {
          select: {
            id: true,
            status: true,
            price: true,
            cityId: true,
            categoryId: true,
          },
        },
        _count: {
          select: { Lot: true },
        },
        City: {
            select: { id: true, name: true }
        }
      },
    });
    
    // Fetch all categories once to avoid N+1 queries
    const allCategories = await prisma.lotCategory.findMany({ select: { id: true, name: true } });
    const categoryMap = new Map(allCategories.map(c => [c.id, c.name]));

    return statesWithLots.map(state => {
      const soldLots = (state as any).Lot.filter((lot: any) => lot.status === 'VENDIDO');
      const lotsSoldCount = soldLots.length;
      const totalRevenue = soldLots.reduce((acc: number, lot: any) => acc + (lot.price || 0), 0);
      const totalLots = (state as any)._count.Lot;
      const salesRate = totalLots > 0 ? (lotsSoldCount / totalLots) * 100 : 0;

      // Find city with highest revenue
      const revenueByCity = new Map<string, number>();
      soldLots.forEach(lot => {
        if (lot.cityId) {
            const cityName = (state as any).City.find((c: any) => c.id === lot.cityId)?.name || 'Desconhecida';
            revenueByCity.set(cityName, (revenueByCity.get(cityName) || 0) + (lot.price || 0));
        }
      });
      const cityWithHighestRevenue = [...revenueByCity.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
      
      // Find most valuable category
      const revenueByCategory = new Map<string, number>();
       soldLots.forEach(lot => {
        if (lot.categoryId) {
            const categoryName = categoryMap.get(lot.categoryId) || 'Outros';
            revenueByCategory.set(categoryName, (revenueByCategory.get(categoryName) || 0) + (lot.price || 0));
        }
      });
      const mostValuableCategory = [...revenueByCategory.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';


      return {
        id: state.id,
        name: state.name,
        uf: state.uf,
        totalLots,
        lotsSoldCount,
        totalRevenue,
        salesRate,
        cityWithHighestRevenue,
        mostValuableCategory,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by revenue descending
    
  } catch (error: any) {
    console.error("[Action - getStatesPerformanceAction] Error fetching state performance:", error);
    throw new Error("Falha ao buscar dados de performance dos estados.");
  }
}
