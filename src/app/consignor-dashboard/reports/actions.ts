// src/app/consignor-dashboard/reports/actions.ts
/**
 * @fileoverview Server Action para o dashboard de relatórios do comitente.
 * Esta ação agrega estatísticas de desempenho para um comitente específico,
 * calculando totais de lotes, vendas, faturamento e dados de vendas mensais
 * para alimentar os gráficos e KPIs do painel.
 */
'use server';

import { getPrismaInstance } from '@/lib/prisma';
import type { ConsignorDashboardStats } from '@/types';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { nowInSaoPaulo, formatInSaoPaulo } from '@/lib/timezone';
import { getSession } from '@/app/auth/actions';

/**
 * Fetches and calculates key performance indicators for a consignor's dashboard.
 * This includes total lots, sold lots, sales value, and sales rate.
 * The data is fetched within the context of the currently authenticated tenant.
 * @param {string} sellerId - The ID of the seller/consignor.
 * @returns {Promise<ConsignorDashboardStats>} A promise resolving to the aggregated stats object.
 */
export async function getConsignorDashboardStatsAction(sellerId: string): Promise<ConsignorDashboardStats> {
    const emptyStats: ConsignorDashboardStats = { totalLotsConsigned: 0, activeLots: 0, soldLots: 0, totalSalesValue: 0, salesRate: 0, salesData: [] };
    
    if (!sellerId) {
        console.warn("[Action - getConsignorDashboardStats] No sellerId provided.");
        return emptyStats;
    }

    const prisma = getPrismaInstance();
    const tenantId = (await getSession())?.tenantId;

    if (!tenantId) {
        console.warn("[Action - getConsignorDashboardStats] No tenantId found in session.");
        return emptyStats;
    }

    const allLots = await prisma.lot.findMany({
        where: { 
            sellerId: sellerId,
            tenantId: tenantId,
        },
        select: { status: true, price: true, createdAt: true }
    });

    const totalLotsConsigned = allLots.length;
    const activeLots = allLots.filter(l => l.status === 'ABERTO_PARA_LANCES').length;
    const soldLots = allLots.filter(l => l.status === 'VENDIDO');
    const totalSalesValue = soldLots.reduce((acc, lot) => acc + (lot.price ? Number(lot.price) : 0), 0);
    const salesRate = totalLotsConsigned > 0 ? (soldLots.length / totalLotsConsigned) * 100 : 0;
    
    // Monthly sales data for the last 12 months
    const salesByMonthMap = new Map<string, number>();
    const now = nowInSaoPaulo();
    for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthKey = format(date, 'MMM/yy', { locale: ptBR });
        salesByMonthMap.set(monthKey, 0);
    }
    
    soldLots.forEach(lot => {
        const monthKey = formatInSaoPaulo(lot.createdAt, 'MMM/yy');
        if (salesByMonthMap.has(monthKey)) {
            salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + (lot.price ? Number(lot.price) : 0));
        }
    });

    const salesData = Array.from(salesByMonthMap, ([name, sales]) => ({ name, sales }));

    return {
        totalLotsConsigned,
        activeLots,
        soldLots: soldLots.length,
        totalSalesValue,
        salesRate,
        salesData,
    };
}
