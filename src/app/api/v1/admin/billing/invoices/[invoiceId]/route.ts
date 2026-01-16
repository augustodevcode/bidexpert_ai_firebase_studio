// src/app/api/v1/admin/billing/invoices/[invoiceId]/route.ts
/**
 * @fileoverview API para gerenciar uma fatura específica.
 * 
 * Endpoints:
 *   GET /api/v1/admin/billing/invoices/:invoiceId - Detalhes da fatura
 *   PATCH /api/v1/admin/billing/invoices/:invoiceId - Atualizar status/pagamento
 *   DELETE /api/v1/admin/billing/invoices/:invoiceId - Cancelar fatura
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { validateAdminApiKey, handleCorsPreflightRequest, withCorsHeaders } from '@/lib/auth/admin-api-guard';

// Schema para atualização de fatura (PATCH)
const updateInvoiceSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']).optional(),
  paidAt: z.string().datetime().optional(),
  paymentMethod: z.string().max(50).optional(),
  paymentReference: z.string().max(100).optional(),
  receiptUrl: z.string().url().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Handler para CORS preflight
export async function OPTIONS() {
  return handleCorsPreflightRequest();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  // 1. Validar API Key
  const authResult = validateAdminApiKey(request);
  if (!authResult.isValid) {
    return withCorsHeaders(NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    ));
  }

  try {
    const { invoiceId } = await params;

    // 2. Buscar fatura
    const invoice = await prisma.tenantInvoice.findUnique({
      where: { id: BigInt(invoiceId) },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    if (!invoice) {
      return withCorsHeaders(NextResponse.json(
        { error: 'Not Found', message: 'Fatura não encontrada' },
        { status: 404 }
      ));
    }

    // 3. Calcular informações adicionais
    const today = new Date();
    const isOverdue = invoice.status === 'PENDING' && invoice.dueDate < today;
    const daysOverdue = isOverdue
      ? Math.floor((today.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // 4. Retornar resposta
    return withCorsHeaders(NextResponse.json({
      success: true,
      data: {
        id: invoice.id.toString(),
        tenant: {
          id: invoice.tenant.id.toString(),
          name: invoice.tenant.name,
          subdomain: invoice.tenant.subdomain,
        },
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
        metadata: invoice.metadata,
        isOverdue,
        daysOverdue,
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString(),
      },
    }));

  } catch (error) {
    console.error('[Admin Billing Invoice Detail API] GET Error:', error);

    return withCorsHeaders(NextResponse.json({
      error: 'Internal Server Error',
      message: 'Erro ao buscar fatura',
    }, { status: 500 }));
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  // 1. Validar API Key
  const authResult = validateAdminApiKey(request);
  if (!authResult.isValid) {
    return withCorsHeaders(NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    ));
  }

  try {
    const { invoiceId } = await params;

    // 2. Verificar se fatura existe
    const existingInvoice = await prisma.tenantInvoice.findUnique({
      where: { id: BigInt(invoiceId) },
    });

    if (!existingInvoice) {
      return withCorsHeaders(NextResponse.json(
        { error: 'Not Found', message: 'Fatura não encontrada' },
        { status: 404 }
      ));
    }

    // 3. Parsear e validar body
    const body = await request.json();
    const data = updateInvoiceSchema.parse(body);

    // 4. Preparar dados para atualização
    const updateData: any = {};

    if (data.status) {
      updateData.status = data.status;
      
      // Se marcando como PAID, registrar data de pagamento
      if (data.status === 'PAID' && !data.paidAt) {
        updateData.paidAt = new Date();
      }
    }

    if (data.paidAt) {
      updateData.paidAt = new Date(data.paidAt);
    }

    if (data.paymentMethod !== undefined) {
      updateData.paymentMethod = data.paymentMethod;
    }

    if (data.paymentReference !== undefined) {
      updateData.paymentReference = data.paymentReference;
    }

    if (data.receiptUrl !== undefined) {
      updateData.receiptUrl = data.receiptUrl;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata;
    }

    // 5. Atualizar fatura
    const invoice = await prisma.tenantInvoice.update({
      where: { id: BigInt(invoiceId) },
      data: updateData,
    });

    // 6. Retornar resposta
    return withCorsHeaders(NextResponse.json({
      success: true,
      data: {
        id: invoice.id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(invoice.amount),
        status: invoice.status,
        paidAt: invoice.paidAt?.toISOString() || null,
        paymentMethod: invoice.paymentMethod,
        paymentReference: invoice.paymentReference,
        updatedAt: invoice.updatedAt.toISOString(),
        message: 'Fatura atualizada com sucesso',
      },
    }));

  } catch (error) {
    console.error('[Admin Billing Invoice Detail API] PATCH Error:', error);

    if (error instanceof z.ZodError) {
      return withCorsHeaders(NextResponse.json({
        error: 'Validation Error',
        message: 'Dados inválidos',
        details: error.errors,
      }, { status: 400 }));
    }

    return withCorsHeaders(NextResponse.json({
      error: 'Internal Server Error',
      message: 'Erro ao atualizar fatura',
    }, { status: 500 }));
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  // 1. Validar API Key
  const authResult = validateAdminApiKey(request);
  if (!authResult.isValid) {
    return withCorsHeaders(NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    ));
  }

  try {
    const { invoiceId } = await params;

    // 2. Verificar se fatura existe
    const existingInvoice = await prisma.tenantInvoice.findUnique({
      where: { id: BigInt(invoiceId) },
    });

    if (!existingInvoice) {
      return withCorsHeaders(NextResponse.json(
        { error: 'Not Found', message: 'Fatura não encontrada' },
        { status: 404 }
      ));
    }

    // 3. Não permitir deletar faturas pagas
    if (existingInvoice.status === 'PAID') {
      return withCorsHeaders(NextResponse.json(
        { error: 'Forbidden', message: 'Não é possível cancelar uma fatura já paga' },
        { status: 403 }
      ));
    }

    // 4. Cancelar fatura (soft delete via status)
    const invoice = await prisma.tenantInvoice.update({
      where: { id: BigInt(invoiceId) },
      data: { status: 'CANCELLED' },
    });

    // 5. Retornar resposta
    return withCorsHeaders(NextResponse.json({
      success: true,
      data: {
        id: invoice.id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        message: 'Fatura cancelada com sucesso',
      },
    }));

  } catch (error) {
    console.error('[Admin Billing Invoice Detail API] DELETE Error:', error);

    return withCorsHeaders(NextResponse.json({
      error: 'Internal Server Error',
      message: 'Erro ao cancelar fatura',
    }, { status: 500 }));
  }
}
