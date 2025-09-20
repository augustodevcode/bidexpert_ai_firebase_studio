// src/app/admin/reports/actions.ts
/**
 * @fileoverview Server Actions para a página principal de relatórios do administrador.
 * Fornece funções que agregam estatísticas chave de toda a plataforma, como
 * contagens totais, faturamento, e dados para gráficos de desempenho, servindo
 * como a fonte de dados para o dashboard geral.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { AdminReportData, Report } from '@/types';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { nowInSaoPaulo, formatInSaoPaulo } from '@/lib/timezone';
import { ReportService } from '@/services/report.service';

const reportService = new ReportService();

/**
 * Busca estatísticas chave para o dashboard de administração.
 * Conta totais de usuários, leilões, lotes, comitentes e calcula métricas
 * como faturamento, novos usuários, e dados para gráficos.
 * @returns {Promise<AdminReportData>} Um objeto com as estatísticas da plataforma.
 */
export async function getAdminReportDataAction(): Promise<AdminReportData> {
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
  ] = await Promise.all([
    prisma.user.count(),
    prisma.auction.count(),
    prisma.lot.count(),
    prisma.seller.count(),
    prisma.lot.aggregate({ _sum: { price: true }, where: { status: 'VENDIDO' } }),
    prisma.user.count({ where: { createdAt: { gte: subDays(nowInSaoPaulo(), 30) } } }),
    prisma.auction.count({ where: { status: 'ABERTO_PARA_LANCES' } }),
    prisma.lot.count({ where: { status: 'VENDIDO' } }),
    prisma.bid.findMany({ select: { amount: true } }),
    prisma.auction.findMany({ include: { _count: { select: { lots: true } } } }),
    prisma.lot.findMany({
      where: { status: 'VENDIDO', categoryId: { not: null } },
      select: { categoryId: true, price: true },
    }),
  ]);

  const totalRevenue = totalRevenueResult._sum.price ? Number(totalRevenueResult._sum.price) : 0;
  const totalBids = bids.length;
  const averageBidValue = totalBids > 0 ? bids.reduce((sum, bid) => sum + Number(bid.amount), 0) / totalBids : 0;
  const successfulAuctions = auctionsWithLots.filter(a => a._count.lots > 0).length;
  const auctionSuccessRate = auctionCount > 0 ? (successfulAuctions / auctionCount) * 100 : 0;
  const totalLotsInAuctions = auctionsWithLots.reduce((sum, a) => sum + a._count.lots, 0);
  const averageLotsPerAuction = auctionCount > 0 ? totalLotsInAuctions / auctionCount : 0;

  // Aggregate monthly sales
  const salesByMonthMap = new Map<string, number>();
  const soldLotsForSales = await prisma.lot.findMany({ where: { status: 'VENDIDO' }, select: { price: true, updatedAt: true } });
  
  soldLotsForSales.forEach(lot => {
    const monthKey = formatInSaoPaulo(lot.updatedAt, 'MMM/yy');
    salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + (lot.price ? Number(lot.price) : 0));
  });

  const salesData = Array.from(salesByMonthMap, ([name, Sales]) => ({ name, Sales }));
  
  // Aggregate sales by category
  const categoryCountMap = new Map<string, number>();
  const categoryIds = [...new Set(soldLotsForCategories.map(lot => lot.categoryId).filter(Boolean) as string[])];
  const categories = await prisma.lotCategory.findMany({ where: { id: { in: categoryIds as string[] } }});
  
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
    auctionSuccessRate,
    averageLotsPerAuction,
  };
}


/**
 * Fetches all saved reports for the current tenant.
 * @returns {Promise<Report[]>} A promise that resolves to an array of reports.
 */
export async function getReportsAction(): Promise<Report[]> {
    return reportService.getReports();
}

/**
 * Fetches a single saved report by its ID for the current tenant.
 * @param {string} id - The ID of the report.
 * @returns {Promise<Report | null>} A promise resolving to the report or null if not found.
 */
export async function getReportAction(id: string): Promise<Report | null> {
    return reportService.getReportById(id);
}

/**
 * Creates a new report record in the database for the current tenant.
 * @param {Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>} data - The report data.
 * @returns {Promise<{success: boolean, message: string, report?: Report}>} The result of the operation.
 */
export async function createReportAction(data: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>): Promise<{success: boolean, message: string, report?: Report}> {
    return reportService.createReport(data);
}

/**
 * Updates an existing report in the database for the current tenant.
 * @param {string} id - The ID of the report to update.
 * @param {Partial<Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>} data - The data to update.
 * @returns {Promise<{success: boolean, message: string}>} The result of the operation.
 */
export async function updateReportAction(id: string, data: Partial<Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<{success: boolean, message: string}> {
    return reportService.updateReport(id, data);
}

/**
 * Deletes a report from the database for the current tenant.
 * @param {string} id - The ID of the report to delete.
 * @returns {Promise<{success: boolean, message: string}>} The result of the operation.
 */
export async function deleteReportAction(id: string): Promise<{success: boolean, message: string}> {
    return reportService.deleteReport(id);
}
