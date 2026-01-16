// src/app/api/v1/admin/stats/route.ts
/**
 * @fileoverview API de métricas agregadas da plataforma.
 * 
 * Fornece KPIs do Dashboard Principal do BidExpertCRM:
 * - Volume Total Transacionado
 * - Total de Leilões Ativos
 * - Total de Tenants por Status
 * - Métricas de crescimento
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateAdminApiKey } from '@/lib/auth/admin-api-guard';

export async function GET(request: NextRequest) {
  // 1. Validar API Key
  const authResult = await validateAdminApiKey(request);
  if (!authResult.isValid) {
    return NextResponse.json({ error: 'Unauthorized', message: authResult.error }, { status: 401 });
  }

  try {
    // Datas para cálculo de métricas
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // 2. Métricas de Tenants
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      newTenantsThisMonth,
      newTenantsLastMonth,
    ] = await Promise.all([
      prisma.tenant.count({ where: { id: { not: BigInt(1) } } }),
      prisma.tenant.count({ where: { id: { not: BigInt(1) }, status: 'ACTIVE' } }),
      prisma.tenant.count({ where: { id: { not: BigInt(1) }, status: 'TRIAL' } }),
      prisma.tenant.count({ where: { id: { not: BigInt(1) }, status: 'SUSPENDED' } }),
      prisma.tenant.count({ 
        where: { 
          id: { not: BigInt(1) }, 
          createdAt: { gte: startOfMonth } 
        } 
      }),
      prisma.tenant.count({ 
        where: { 
          id: { not: BigInt(1) }, 
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } 
        } 
      }),
    ]);

    // 3. Métricas de Leilões (todos os tenants)
    const [
      totalAuctions,
      activeAuctions,
      completedAuctions,
      totalLots,
      soldLots,
    ] = await Promise.all([
      prisma.auction.count(),
      prisma.auction.count({ 
        where: { 
          status: { in: ['PUBLICADO', 'ABERTO_PARA_LANCES', 'EM_ANDAMENTO'] } 
        } 
      }),
      prisma.auction.count({ where: { status: 'ENCERRADO' } }),
      prisma.lot.count(),
      prisma.lot.count({ where: { status: 'ARREMATADO' } }),
    ]);

    // 4. Métricas de Usuários
    const [
      totalUsers,
      newUsersThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    // 5. Volume Transacionado (soma dos lances vencedores)
    const volumeResult = await prisma.lot.aggregate({
      where: { 
        status: 'ARREMATADO',
        finalBid: { not: null },
      },
      _sum: { finalBid: true },
    });
    const totalVolume = volumeResult._sum.finalBid?.toNumber() || 0;

    // Volume do mês atual
    const volumeThisMonth = await prisma.lot.aggregate({
      where: { 
        status: 'ARREMATADO',
        finalBid: { not: null },
        updatedAt: { gte: startOfMonth },
      },
      _sum: { finalBid: true },
    });

    // 6. Top 5 Tenants por Volume
    const topTenantsByVolume = await prisma.lot.groupBy({
      by: ['tenantId'],
      where: { 
        status: 'ARREMATADO',
        finalBid: { not: null },
      },
      _sum: { finalBid: true },
      _count: true,
      orderBy: { _sum: { finalBid: 'desc' } },
      take: 5,
    });

    // Buscar nomes dos tenants
    const topTenantIds = topTenantsByVolume.map(t => t.tenantId);
    const topTenantsInfo = await prisma.tenant.findMany({
      where: { id: { in: topTenantIds } },
      select: { id: true, name: true, subdomain: true },
    });

    const topTenants = topTenantsByVolume.map(t => {
      const info = topTenantsInfo.find(ti => ti.id === t.tenantId);
      return {
        tenantId: t.tenantId.toString(),
        name: info?.name || 'Unknown',
        subdomain: info?.subdomain || '',
        totalVolume: t._sum.finalBid?.toNumber() || 0,
        lotsCount: t._count,
      };
    });

    // 7. Métricas de Crescimento
    const tenantGrowth = newTenantsLastMonth > 0 
      ? ((newTenantsThisMonth - newTenantsLastMonth) / newTenantsLastMonth * 100).toFixed(1)
      : newTenantsThisMonth > 0 ? '100' : '0';

    return NextResponse.json({
      success: true,
      data: {
        // Tenants
        tenants: {
          total: totalTenants,
          active: activeTenants,
          trial: trialTenants,
          suspended: suspendedTenants,
          cancelled: totalTenants - activeTenants - trialTenants - suspendedTenants,
          newThisMonth: newTenantsThisMonth,
          newLastMonth: newTenantsLastMonth,
          growthPercent: parseFloat(tenantGrowth),
        },
        // Leilões
        auctions: {
          total: totalAuctions,
          active: activeAuctions,
          completed: completedAuctions,
        },
        // Lotes
        lots: {
          total: totalLots,
          sold: soldLots,
          conversionRate: totalLots > 0 ? ((soldLots / totalLots) * 100).toFixed(1) : '0',
        },
        // Usuários
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
        },
        // Volume Financeiro
        financial: {
          totalVolume,
          volumeThisMonth: volumeThisMonth._sum.finalBid?.toNumber() || 0,
          currency: 'BRL',
        },
        // Top Tenants
        topTenants,
        // Metadata
        generatedAt: new Date().toISOString(),
        period: {
          currentMonth: startOfMonth.toISOString(),
          lastMonth: startOfLastMonth.toISOString(),
        },
      },
    });

  } catch (error) {
    console.error('[GET /api/v1/admin/stats] Erro:', error);

    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}
