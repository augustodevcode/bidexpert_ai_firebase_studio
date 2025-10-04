// src/services/dashboard.service.ts
/**
 * @fileoverview Este arquivo contém a classe DashboardService, responsável por
 * agregar dados de várias fontes para alimentar os dashboards da aplicação.
 * Isso inclui os painéis de administração, do comitente e do usuário final.
 * A centralização dessa lógica evita a duplicação de consultas complexas
 * nas `server actions`.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { nowInSaoPaulo, formatInSaoPaulo } from '@/lib/timezone';
import type { AdminReportData } from '@/types';

export class DashboardService {
    private prisma;

    constructor() {
        this.prisma = prisma;
    }

    /**
     * Agrega as principais métricas de toda a plataforma para o dashboard do admin.
     * @returns {Promise<AdminReportData>} Os dados consolidados para o dashboard.
     */
    async getAdminDashboardStats(): Promise<AdminReportData> {
         const [
            userCount,
            auctionCount,
            lotCount,
            sellerCount,
            totalRevenueResult,
            newUsersCount,
            activeAuctionsCount,
            lotsSoldCount,
            bids,
            auctionsWithLots,
            soldLotsForCategories,
        ] = await this.prisma.$transaction([
            this.prisma.user.count(),
            this.prisma.auction.count(),
            this.prisma.lot.count(),
            this.prisma.seller.count(),
            this.prisma.lot.aggregate({ _sum: { price: true }, where: { status: 'VENDIDO' } }),
            this.prisma.user.count({ where: { createdAt: { gte: subDays(nowInSaoPaulo(), 30) } } }),
            this.prisma.auction.count({ where: { status: 'ABERTO_PARA_LANCES' } }),
            this.prisma.lot.count({ where: { status: 'VENDIDO' } }),
            this.prisma.bid.findMany({ select: { amount: true } }),
            this.prisma.auction.findMany({ include: { _count: { select: { lots: true } } } }),
            this.prisma.lot.findMany({
                where: { status: 'VENDIDO', categoryId: { not: null } },
                select: { categoryId: true, price: true },
            }),
        ]);
        
        const totalRevenue = totalRevenueResult._sum.price ? Number(totalRevenueResult._sum.price) : 0;
        const totalBids = bids.length;
        const averageBidValue = totalBids > 0 ? bids.reduce((sum, bid) => sum + Number(bid.amount), 0) / totalBids : 0;
        
        const salesByMonthMap = new Map<string, number>();
        const soldLotsForSales = await this.prisma.lot.findMany({ where: { status: 'VENDIDO' }, select: { price: true, updatedAt: true } });
        
        // Initialize map for the last 12 months to ensure all months are present
        const now = nowInSaoPaulo();
        for (let i = 11; i >= 0; i--) {
            const date = subMonths(now, i);
            const monthKey = format(date, 'MMM/yy', { locale: ptBR });
            salesByMonthMap.set(monthKey, 0);
        }

        soldLotsForSales.forEach(lot => {
            const monthKey = formatInSaoPaulo(lot.updatedAt, 'MMM/yy');
            if (salesByMonthMap.has(monthKey)) {
                salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + (lot.price ? Number(lot.price) : 0));
            }
        });

        const salesData = Array.from(salesByMonthMap, ([name, Sales]) => ({ name, Sales }));
        
        const categoryCountMap = new Map<string, number>();
        const categoryIds = [...new Set(soldLotsForCategories.map(lot => lot.categoryId).filter(Boolean) as string[])];
        const categories = await this.prisma.lotCategory.findMany({ where: { id: { in: categoryIds } }});
        
        soldLotsForCategories.forEach(lot => {
            const categoryName = categories.find(c => c.id === lot.categoryId)?.name || 'Outros';
            categoryCountMap.set(categoryName, (categoryCountMap.get(categoryName) || 0) + 1);
        });

        const categoryData = Array.from(categoryCountMap, ([name, value]) => ({ name, value }));

        return {
            users: userCount,
            auctions: auctionCount,
            lots: lotCount,
            sellers: sellerCount,
            totalRevenue,
            newUsersLast30Days: newUsersCount,
            activeAuctions: activeAuctionsCount,
            lotsSoldCount,
            salesData,
            categoryData,
            averageBidValue,
            auctionSuccessRate: auctionCount > 0 ? (auctionsWithLots.filter(a => a._count.lots > 0).length / auctionCount) * 100 : 0,
            averageLotsPerAuction: auctionCount > 0 ? auctionsWithLots.reduce((sum, a) => sum + a._count.lots, 0) / auctionCount : 0,
        };
    }
}
