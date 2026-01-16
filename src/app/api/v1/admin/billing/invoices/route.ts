// src/app/api/v1/admin/billing/invoices/route.ts
/**
 * @fileoverview API de Histórico de Faturas para o BidExpertCRM.
 * 
 * Lista faturas do tenant com status (Paga, Pendente, Atrasada),
 * permitindo auditoria dos custos.
 * 
 * Endpoints:
 *   GET /api/v1/admin/billing/invoices - Listar faturas
 *   POST /api/v1/admin/billing/invoices - Criar nova fatura (para Control Plane)
 * 
 * Query Params (GET):
 *   - tenantId (required): ID do tenant
 *   - status (optional): PENDING | PAID | OVERDUE | CANCELLED | REFUNDED
 *   - startDate (optional): Data inicial ISO
 *   - endDate (optional): Data final ISO
 *   - page (optional): Página atual
 *   - limit (optional): Itens por página
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { validateAdminApiKey, handleCorsPreflightRequest, withCorsHeaders } from '@/lib/auth/admin-api-guard';

// Schema de validação dos query params (GET)
const getQuerySchema = z.object({
  tenantId: z.coerce.bigint(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Schema de validação do body (POST)
const createInvoiceSchema = z.object({
  tenantId: z.coerce.bigint(),
  invoiceNumber: z.string().min(1).max(50),
  externalId: z.string().max(100).optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('BRL'),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  dueDate: z.string().datetime(),
  description: z.string().optional(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number(),
    total: z.number(),
  })).optional(),
  invoiceUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

// Schema para atualização de status (PATCH)
const updateInvoiceSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']),
  paidAt: z.string().datetime().optional(),
  paymentMethod: z.string().max(50).optional(),
  paymentReference: z.string().max(100).optional(),
  receiptUrl: z.string().url().optional(),
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
    const params = getQuerySchema.parse(searchParams);

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

    // 4. Construir filtros
    const where: any = {
      tenantId: params.tenantId,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.startDate || params.endDate) {
      where.issueDate = {};
      if (params.startDate) {
        where.issueDate.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        where.issueDate.lte = new Date(params.endDate);
      }
    }

    // 5. Buscar total para paginação
    const total = await prisma.tenantInvoice.count({ where });

    // 6. Buscar faturas
    const invoices = await prisma.tenantInvoice.findMany({
      where,
      orderBy: { issueDate: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });

    // 7. Calcular métricas agregadas
    const aggregates = await prisma.tenantInvoice.groupBy({
      by: ['status'],
      where: { tenantId: params.tenantId },
      _sum: { amount: true },
      _count: { id: true },
    });

    const statusSummary: Record<string, { count: number; total: number }> = {};
    for (const agg of aggregates) {
      statusSummary[agg.status] = {
        count: agg._count.id,
        total: Number(agg._sum.amount || 0),
      };
    }

    // 8. Verificar faturas vencidas e atualizar status
    const today = new Date();
    const overdueInvoices = await prisma.tenantInvoice.updateMany({
      where: {
        tenantId: params.tenantId,
        status: 'PENDING',
        dueDate: { lt: today },
      },
      data: { status: 'OVERDUE' },
    });

    // 9. Formatar faturas para resposta
    const formattedInvoices = invoices.map((invoice: typeof invoices[number]) => ({
      id: invoice.id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      externalId: invoice.externalId,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      periodStart: invoice.periodStart.toISOString(),
      periodEnd: invoice.periodEnd.toISOString(),
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      paidAt: invoice.paidAt?.toISOString() || null,
      status: invoice.status,
      description: invoice.description,
      lineItems: invoice.lineItems,
      paymentMethod: invoice.paymentMethod,
      paymentReference: invoice.paymentReference,
      invoiceUrl: invoice.invoiceUrl,
      receiptUrl: invoice.receiptUrl,
      isOverdue: invoice.status === 'PENDING' && invoice.dueDate < today,
      daysOverdue: invoice.status === 'OVERDUE' 
        ? Math.floor((today.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    }));

    // 10. Retornar resposta
    return withCorsHeaders(NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id.toString(),
          name: tenant.name,
        },
        summary: {
          totalInvoices: total,
          byStatus: statusSummary,
          totalPaid: statusSummary['PAID']?.total || 0,
          totalPending: statusSummary['PENDING']?.total || 0,
          totalOverdue: statusSummary['OVERDUE']?.total || 0,
        },
        invoices: formattedInvoices,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit),
        },
      },
    }));

  } catch (error) {
    console.error('[Admin Billing Invoices API] Error:', error);

    if (error instanceof z.ZodError) {
      return withCorsHeaders(NextResponse.json({
        error: 'Validation Error',
        message: 'Parâmetros inválidos',
        details: error.errors,
      }, { status: 400 }));
    }

    return withCorsHeaders(NextResponse.json({
      error: 'Internal Server Error',
      message: 'Erro ao buscar faturas',
    }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  // 1. Validar API Key
  const authResult = validateAdminApiKey(request);
  if (!authResult.isValid) {
    return withCorsHeaders(NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    ));
  }

  try {
    // 2. Parsear e validar body
    const body = await request.json();
    const data = createInvoiceSchema.parse(body);

    // 3. Verificar se tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return withCorsHeaders(NextResponse.json(
        { error: 'Not Found', message: 'Tenant não encontrado' },
        { status: 404 }
      ));
    }

    // 4. Verificar se invoiceNumber já existe
    const existingInvoice = await prisma.tenantInvoice.findUnique({
      where: { invoiceNumber: data.invoiceNumber },
    });

    if (existingInvoice) {
      return withCorsHeaders(NextResponse.json(
        { error: 'Conflict', message: 'Número de fatura já existe' },
        { status: 409 }
      ));
    }

    // 5. Criar fatura
    const invoice = await prisma.tenantInvoice.create({
      data: {
        tenantId: data.tenantId,
        invoiceNumber: data.invoiceNumber,
        externalId: data.externalId,
        amount: data.amount,
        currency: data.currency,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        dueDate: new Date(data.dueDate),
        description: data.description,
        lineItems: data.lineItems,
        invoiceUrl: data.invoiceUrl,
        metadata: data.metadata,
        status: 'PENDING',
      },
    });

    // 6. Retornar resposta
    return withCorsHeaders(NextResponse.json({
      success: true,
      data: {
        id: invoice.id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        externalId: invoice.externalId,
        amount: Number(invoice.amount),
        currency: invoice.currency,
        periodStart: invoice.periodStart.toISOString(),
        periodEnd: invoice.periodEnd.toISOString(),
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        status: invoice.status,
        message: 'Fatura criada com sucesso',
      },
    }, { status: 201 }));

  } catch (error) {
    console.error('[Admin Billing Invoices API] POST Error:', error);

    if (error instanceof z.ZodError) {
      return withCorsHeaders(NextResponse.json({
        error: 'Validation Error',
        message: 'Dados inválidos',
        details: error.errors,
      }, { status: 400 }));
    }

    return withCorsHeaders(NextResponse.json({
      error: 'Internal Server Error',
      message: 'Erro ao criar fatura',
    }, { status: 500 }));
  }
}
