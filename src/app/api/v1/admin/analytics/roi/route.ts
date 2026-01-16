// src/app/api/v1/admin/analytics/roi/route.ts
/**
 * @fileoverview API de Consolidado Financeiro (ROI) para o BidExpertCRM.
 * 
 * Cruza dados de faturas pagas pelo tenant com dados de vendas realizadas,
 * calculando o ROI (Return on Investment) por período.
 * 
 * Endpoint: GET /api/v1/admin/analytics/roi
 * Query Params: 
 *   - tenantId (required): ID do tenant
 *   - startDate (optional): Data inicial ISO (default: 12 meses atrás)
 *   - endDate (optional): Data final ISO (default: hoje)
 *   - granularity (optional): month | year (default: month)
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
  granularity: z.enum(['month', 'year']).default('month'),
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
      select: { id: true, name: true },
    });

    if (!tenant) {
      return withCorsHeaders(NextResponse.json(
        { error: 'Not Found', message: 'Tenant não encontrado' },
        { status: 404 }
      ));
    }

    // 4. Buscar custos (faturas pagas)
    const invoices = await prisma.tenantInvoice.findMany({
      where: {
        tenantId: params.tenantId,
        status: 'PAID',
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        paidAt: true,
        periodStart: true,
      },
    });

    // 5. Buscar receitas (vendas arrematadas - lotes com vencedor)
    const sales = await prisma.lot.findMany({
      where: {
        auction: {
          tenantId: params.tenantId,
        },
        winnerId: { not: null },
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        price: true,
        updatedAt: true,
      },
    });

    // Também considerar UserWin para vendas confirmadas
    const confirmedWins = await prisma.userWin.findMany({
      where: {
        tenantId: params.tenantId,
        winDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        winningBidAmount: true,
        winDate: true,
      },
    });

    // 6. Agrupar por período
    const historyMap = new Map<string, { cost: number; revenue: number }>();

    // Inicializar períodos
    const current = new Date(startDate);
    while (current <= endDate) {
      const periodKey = params.granularity === 'month'
        ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
        : `${current.getFullYear()}`;
      
      if (!historyMap.has(periodKey)) {
        historyMap.set(periodKey, { cost: 0, revenue: 0 });
      }

      if (params.granularity === 'month') {
        current.setMonth(current.getMonth() + 1);
      } else {
        current.setFullYear(current.getFullYear() + 1);
      }
    }

    // Agregar custos
    for (const invoice of invoices) {
      const date = invoice.paidAt || invoice.periodStart;
      const periodKey = params.granularity === 'month'
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : `${date.getFullYear()}`;
      
      const entry = historyMap.get(periodKey) || { cost: 0, revenue: 0 };
      entry.cost += Number(invoice.amount);
      historyMap.set(periodKey, entry);
    }

    // Agregar receitas de UserWin (vendas confirmadas)
    for (const win of confirmedWins) {
      const periodKey = params.granularity === 'month'
        ? `${win.winDate.getFullYear()}-${String(win.winDate.getMonth() + 1).padStart(2, '0')}`
        : `${win.winDate.getFullYear()}`;
      
      const entry = historyMap.get(periodKey) || { cost: 0, revenue: 0 };
      entry.revenue += Number(win.winningBidAmount);
      historyMap.set(periodKey, entry);
    }

    // Se não houver UserWin, usar vendas de Lot com vencedor
    if (confirmedWins.length === 0) {
      for (const sale of sales) {
        const periodKey = params.granularity === 'month'
          ? `${sale.updatedAt.getFullYear()}-${String(sale.updatedAt.getMonth() + 1).padStart(2, '0')}`
          : `${sale.updatedAt.getFullYear()}`;
        
        const entry = historyMap.get(periodKey) || { cost: 0, revenue: 0 };
        entry.revenue += Number(sale.price);
        historyMap.set(periodKey, entry);
      }
    }

    // 7. Calcular totais e ROI
    let totalCost = 0;
    let totalRevenue = 0;

    const history = Array.from(historyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => {
        totalCost += data.cost;
        totalRevenue += data.revenue;
        return {
          period,
          cost: Number(data.cost.toFixed(2)),
          revenue: Number(data.revenue.toFixed(2)),
        };
      });

    const roiMultiplier = totalCost > 0 
      ? Number((totalRevenue / totalCost).toFixed(2)) 
      : 0;

    // 8. Retornar resposta
    return withCorsHeaders(NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id.toString(),
          name: tenant.name,
        },
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          granularity: params.granularity,
        },
        summary: {
          totalCost: Number(totalCost.toFixed(2)),
          totalRevenue: Number(totalRevenue.toFixed(2)),
          roiMultiplier,
          netProfit: Number((totalRevenue - totalCost).toFixed(2)),
        },
        history,
      },
    }));

  } catch (error) {
    console.error('[Admin Analytics ROI API] Error:', error);

    if (error instanceof z.ZodError) {
      return withCorsHeaders(NextResponse.json({
        error: 'Validation Error',
        message: 'Parâmetros inválidos',
        details: error.errors,
      }, { status: 400 }));
    }

    return withCorsHeaders(NextResponse.json({
      error: 'Internal Server Error',
      message: 'Erro ao processar análise de ROI',
    }, { status: 500 }));
  }
}
