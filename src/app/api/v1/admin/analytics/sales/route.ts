// src/app/api/v1/admin/analytics/sales/route.ts
/**
 * @fileoverview API de Vendas Detalhadas para o BidExpertCRM.
 * 
 * Retorna o volume bruto de vendas (GMV - Gross Merchandise Value) 
 * e dados de comissões do leiloeiro.
 * 
 * Endpoint: GET /api/v1/admin/analytics/sales
 * Query Params: 
 *   - tenantId (required): ID do tenant
 *   - startDate (optional): Data inicial ISO
 *   - endDate (optional): Data final ISO
 *   - status (optional): Filtrar por status do lote
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { validateAdminApiKey, handleCorsPreflightRequest, withCorsHeaders } from '@/lib/auth/admin-api-guard';

// Schema de validação dos query params
const querySchema = z.object({
  tenantId: z.coerce.bigint(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['VENDIDO', 'ARREMADO', 'CONCLUIDO']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

// Handler para CORS preflight
export async function OPTIONS() {
  return handleCorsPreflightRequest();
}

export async function GET(request: NextRequest) {
  // 1. Validar API Key
  const authResult = validateAdminApiKey(request);
  if (!authResult.isValid) {
    return withCorsHeaders(NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    ));
  }

  try {
    // 2. Parsear query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = querySchema.parse(searchParams);

    // Definir período padrão (últimos 12 meses)
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const startDate = params.startDate ? new Date(params.startDate) : defaultStartDate;
    const endDate = params.endDate ? new Date(params.endDate) : now;

    // 3. Verificar se tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.tenantId },
      select: { 
        id: true, 
        name: true,
        settings: {
          select: {
            auctioneerCommissionRate: true,
          },
        },
      },
    });

    if (!tenant) {
      return withCorsHeaders(NextResponse.json(
        { error: 'Not Found', message: 'Tenant não encontrado' },
        { status: 404 }
      ));
    }

    // Taxa de comissão padrão (5% se não configurado)
    const commissionRate = tenant.settings?.auctioneerCommissionRate 
      ? Number(tenant.settings.auctioneerCommissionRate) / 100 
      : 0.05;

    // 4. Buscar vendas confirmadas (UserWin)
    const confirmedSales = await prisma.userWin.findMany({
      where: {
        tenantId: params.tenantId,
        winDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        Lot: {
          select: {
            id: true,
            publicId: true,
            title: true,
            price: true,
            Auction: {
              select: {
                id: true,
                publicId: true,
                title: true,
              },
            },
          },
        },
        User: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { winDate: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });

    // 5. Contar total para paginação
    const totalCount = await prisma.userWin.count({
      where: {
        tenantId: params.tenantId,
        winDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 6. Calcular métricas agregadas
    const aggregateResult = await prisma.userWin.aggregate({
      where: {
        tenantId: params.tenantId,
        winDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        winningBidAmount: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        winningBidAmount: true,
      },
    });

    const gmv = Number(aggregateResult._sum.winningBidAmount || 0);
    const totalSales = aggregateResult._count.id;
    const avgSaleValue = Number(aggregateResult._avg.winningBidAmount || 0);
    const totalCommission = gmv * commissionRate;

    // 7. Buscar estatísticas de leilões
    const auctionStats = await prisma.auction.aggregate({
      where: {
        tenantId: params.tenantId,
        status: { in: ['CONCLUIDO', 'FINALIZADO'] },
        endDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        achievedRevenue: true,
      },
    });

    // 8. Formatar vendas para resposta
    const sales = confirmedSales.map((sale: typeof confirmedSales[number]) => ({
      id: sale.id.toString(),
      lotId: (sale.Lot || (sale as any).lot).id.toString(),
      lotPublicId: (sale.Lot || (sale as any).lot).publicId,
      lotTitle: (sale.Lot || (sale as any).lot).title,
      auctionId: (sale.Lot || (sale as any).lot).Auction?.id.toString() || (sale.Lot || (sale as any).lot).auction?.id.toString(),
      auctionPublicId: (sale.Lot || (sale as any).lot).Auction?.publicId || (sale.Lot || (sale as any).lot).auction?.publicId,
      auctionTitle: (sale.Lot || (sale as any).lot).Auction?.title || (sale.Lot || (sale as any).lot).auction?.title,
      winnerId: (sale.User || (sale as any).user).id.toString(),
      winnerName: (sale.User || (sale as any).user).fullName,
      winnerEmail: (sale.User || (sale as any).user).email,
      saleAmount: Number(sale.winningBidAmount),
      commission: Number((Number(sale.winningBidAmount) * commissionRate).toFixed(2)),
      paymentStatus: sale.paymentStatus,
      saleDate: sale.winDate.toISOString(),
    }));

    // 9. Retornar resposta
    return withCorsHeaders(NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id.toString(),
          name: tenant.name,
          commissionRate: Number((commissionRate * 100).toFixed(2)),
        },
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        summary: {
          gmv: Number(gmv.toFixed(2)),
          totalSales,
          avgSaleValue: Number(avgSaleValue.toFixed(2)),
          totalCommission: Number(totalCommission.toFixed(2)),
          completedAuctions: auctionStats._count.id,
          achievedRevenue: Number(auctionStats._sum.achievedRevenue || 0),
        },
        sales,
        pagination: {
          page: params.page,
          limit: params.limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / params.limit),
        },
      },
    }));

  } catch (error) {
    console.error('[Admin Analytics Sales API] Error:', error);

    if (error instanceof z.ZodError) {
      return withCorsHeaders(NextResponse.json({
        error: 'Validation Error',
        message: 'Parâmetros inválidos',
        details: error.errors,
      }, { status: 400 }));
    }

    return withCorsHeaders(NextResponse.json({
      error: 'Internal Server Error',
      message: 'Erro ao processar análise de vendas',
    }, { status: 500 }));
  }
}
