// src/app/api/v1/admin/tenant/[id]/invoices/route.ts
/**
 * @fileoverview API para histórico financeiro/faturas de um tenant.
 * 
 * Permite ao suporte visualizar se o cliente está em dia
 * com a mensalidade do software.
 * 
 * NOTA: Esta API trabalha com dados armazenados localmente.
 * Em produção, pode ser integrada com gateway de pagamento (Stripe, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { validateAdminApiKey } from '@/lib/auth/admin-api-guard';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Schema para criar invoice (usado pelo CRM quando gera cobrança)
const createInvoiceSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo"),
  currency: z.string().default('BRL'),
  description: z.string().min(1, "Descrição é obrigatória"),
  dueDate: z.string().datetime(),
  externalId: z.string().optional(), // ID do gateway de pagamento
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
  })).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Validar API Key
  const authResult = await validateAdminApiKey(request);
  if (!authResult.isValid) {
    return NextResponse.json({ error: 'Unauthorized', message: authResult.error }, { status: 401 });
  }

  try {
    const tenantId = BigInt(params.id);

    // 2. Verificar se tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { 
        id: true, 
        name: true, 
        planId: true,
        status: true,
        metadata: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    // 3. Parsear query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryParams = querySchema.parse(searchParams);

    // 4. Buscar invoices do tenant
    // NOTA: Assumindo que existe uma tabela TenantInvoice ou similar
    // Se não existir, retornamos dados do metadata ou mock

    // Verificar se a tabela existe
    let invoices: any[] = [];
    let total = 0;
    let hasInvoiceTable = false;

    try {
      // Tenta buscar da tabela de invoices (se existir)
      const invoiceCount = await (prisma as any).tenantInvoice?.count({
        where: { tenantId },
      });
      hasInvoiceTable = invoiceCount !== undefined;
    } catch {
      hasInvoiceTable = false;
    }

    if (hasInvoiceTable) {
      // Buscar invoices reais
      const where: any = { tenantId };
      
      if (queryParams.status) {
        where.status = queryParams.status;
      }
      
      if (queryParams.startDate || queryParams.endDate) {
        where.createdAt = {};
        if (queryParams.startDate) where.createdAt.gte = new Date(queryParams.startDate);
        if (queryParams.endDate) where.createdAt.lte = new Date(queryParams.endDate);
      }

      total = await (prisma as any).tenantInvoice.count({ where });
      invoices = await (prisma as any).tenantInvoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (queryParams.page - 1) * queryParams.limit,
        take: queryParams.limit,
      });
    } else {
      // Retornar dados do metadata ou mock para demonstração
      const metadata = tenant.metadata as any || {};
      invoices = metadata.invoices || [];
      total = invoices.length;
      
      // Aplicar paginação manual
      const start = (queryParams.page - 1) * queryParams.limit;
      invoices = invoices.slice(start, start + queryParams.limit);
    }

    // 5. Calcular sumário financeiro
    const summary = {
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
      lastPaymentDate: null as string | null,
      nextDueDate: null as string | null,
    };

    // Se tivermos invoices, calcular sumário
    if (Array.isArray(invoices)) {
      invoices.forEach((inv: any) => {
        if (inv.status === 'PAID') {
          summary.totalPaid += inv.amount || 0;
          if (!summary.lastPaymentDate || inv.paidAt > summary.lastPaymentDate) {
            summary.lastPaymentDate = inv.paidAt;
          }
        } else if (inv.status === 'PENDING') {
          summary.totalPending += inv.amount || 0;
          if (!summary.nextDueDate || inv.dueDate < summary.nextDueDate) {
            summary.nextDueDate = inv.dueDate;
          }
        } else if (inv.status === 'OVERDUE') {
          summary.totalOverdue += inv.amount || 0;
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id.toString(),
          name: tenant.name,
          planId: tenant.planId,
          status: tenant.status,
        },
        invoices: invoices.map((inv: any) => ({
          id: inv.id?.toString() || inv.externalId,
          amount: inv.amount,
          currency: inv.currency || 'BRL',
          status: inv.status,
          description: inv.description,
          dueDate: inv.dueDate,
          paidAt: inv.paidAt,
          externalId: inv.externalId,
          items: inv.items,
          createdAt: inv.createdAt,
        })),
        summary,
        pagination: {
          page: queryParams.page,
          limit: queryParams.limit,
          total,
          totalPages: Math.ceil(total / queryParams.limit),
        },
        // Indicar se está usando dados reais ou mock
        dataSource: hasInvoiceTable ? 'database' : 'metadata',
      },
    });

  } catch (error) {
    console.error('[GET /api/v1/admin/tenant/[id]/invoices] Erro:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Parâmetros inválidos',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}

// POST - Criar nova invoice (chamado pelo CRM ao gerar cobrança)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Validar API Key
  const authResult = await validateAdminApiKey(request);
  if (!authResult.isValid) {
    return NextResponse.json({ error: 'Unauthorized', message: authResult.error }, { status: 401 });
  }

  try {
    const tenantId = BigInt(params.id);

    // 2. Verificar se tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    // 3. Parsear body
    const body = await request.json();
    const data = createInvoiceSchema.parse(body);

    // 4. Criar invoice (no metadata por enquanto, até ter tabela dedicada)
    const invoiceId = `INV-${Date.now()}`;
    const newInvoice = {
      id: invoiceId,
      ...data,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const existingMetadata = (tenant.metadata as any) || {};
    const existingInvoices = existingMetadata.invoices || [];

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        metadata: {
          ...existingMetadata,
          invoices: [...existingInvoices, newInvoice],
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        invoice: newInvoice,
        message: 'Invoice criada com sucesso',
      },
    }, { status: 201 });

  } catch (error) {
    console.error('[POST /api/v1/admin/tenant/[id]/invoices] Erro:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}
