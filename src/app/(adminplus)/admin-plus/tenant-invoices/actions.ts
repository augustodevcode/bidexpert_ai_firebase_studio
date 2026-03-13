/**
 * Server Actions para CRUD de TenantInvoice no Admin Plus.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { sanitizeResponse } from '@/lib/serialization-helper';
import type { TenantInvoiceRow } from './types';
import type { TenantInvoiceFormData } from './schema';

function toRow(r: any): TenantInvoiceRow {
  return {
    id: r.id.toString(),
    tenantId: r.tenantId.toString(),
    tenantName: r.Tenant?.name ?? '-',
    invoiceNumber: r.invoiceNumber,
    externalId: r.externalId ?? '',
    amount: r.amount?.toString() ?? '0',
    currency: r.currency ?? 'BRL',
    periodStart: r.periodStart?.toISOString() ?? '',
    periodEnd: r.periodEnd?.toISOString() ?? '',
    issueDate: r.issueDate?.toISOString() ?? '',
    dueDate: r.dueDate?.toISOString() ?? '',
    paidAt: r.paidAt?.toISOString() ?? '',
    status: r.status,
    description: r.description ?? '',
    lineItems: r.lineItems ? JSON.stringify(r.lineItems) : '',
    paymentMethod: r.paymentMethod ?? '',
    paymentReference: r.paymentReference ?? '',
    invoiceUrl: r.invoiceUrl ?? '',
    receiptUrl: r.receiptUrl ?? '',
    metadata: r.metadata ? JSON.stringify(r.metadata) : '',
    createdAt: r.createdAt?.toISOString() ?? '',
    updatedAt: r.updatedAt?.toISOString() ?? '',
  };
}

const include = { Tenant: { select: { name: true } } };

/* ── list ── */
export const listTenantInvoices = createAdminAction(async (ctx, params: { page: number; pageSize: number; sortField?: string; sortDirection?: string; search?: string }) => {
  const where: any = { tenantId: ctx.tenantIdBigInt };
  if (params.search) { where.AND = [{ OR: [{ invoiceNumber: { contains: params.search } }, { Tenant: { name: { contains: params.search } } }] }]; }
  const orderBy = params.sortField ? { [params.sortField]: params.sortDirection || 'asc' } : { createdAt: 'desc' as const };
  const [data, total] = await Promise.all([
    prisma.tenantInvoice.findMany({ where, include, orderBy, skip: (params.page - 1) * params.pageSize, take: params.pageSize }),
    prisma.tenantInvoice.count({ where }),
  ]);
  return sanitizeResponse({ data: data.map(toRow), total, page: params.page, pageSize: params.pageSize, totalPages: Math.ceil(total / params.pageSize) });
});

/* ── create ── */
export const createTenantInvoice = createAdminAction(async (ctx, data: TenantInvoiceFormData) => {
  const record = await prisma.tenantInvoice.create({
    data: {
      tenantId: BigInt(data.tenantId),
      invoiceNumber: data.invoiceNumber,
      externalId: data.externalId || null,
      amount: parseFloat(data.amount),
      currency: data.currency || 'BRL',
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      dueDate: new Date(data.dueDate),
      paidAt: data.paidAt ? new Date(data.paidAt) : null,
      status: data.status as any,
      description: data.description || null,
      lineItems: data.lineItems ? JSON.parse(data.lineItems) : null,
      paymentMethod: data.paymentMethod || null,
      paymentReference: data.paymentReference || null,
      invoiceUrl: data.invoiceUrl || null,
      receiptUrl: data.receiptUrl || null,
      metadata: data.metadata ? JSON.parse(data.metadata) : null,
      updatedAt: new Date(),
    },
    include,
  });
  return sanitizeResponse(toRow(record));
});

/* ── update ── */
export const updateTenantInvoice = createAdminAction(async (_ctx, params: { id: string; data: TenantInvoiceFormData }) => {
  const record = await prisma.tenantInvoice.update({
    where: { id: BigInt(params.id) },
    data: {
      tenantId: BigInt(params.data.tenantId),
      invoiceNumber: params.data.invoiceNumber,
      externalId: params.data.externalId || null,
      amount: parseFloat(params.data.amount),
      currency: params.data.currency || 'BRL',
      periodStart: new Date(params.data.periodStart),
      periodEnd: new Date(params.data.periodEnd),
      dueDate: new Date(params.data.dueDate),
      paidAt: params.data.paidAt ? new Date(params.data.paidAt) : null,
      status: params.data.status as any,
      description: params.data.description || null,
      lineItems: params.data.lineItems ? JSON.parse(params.data.lineItems) : null,
      paymentMethod: params.data.paymentMethod || null,
      paymentReference: params.data.paymentReference || null,
      invoiceUrl: params.data.invoiceUrl || null,
      receiptUrl: params.data.receiptUrl || null,
      metadata: params.data.metadata ? JSON.parse(params.data.metadata) : null,
    },
    include,
  });
  return sanitizeResponse(toRow(record));
});

/* ── delete ── */
export const deleteTenantInvoice = createAdminAction(async (_ctx, params: { id: string }) => {
  await prisma.tenantInvoice.delete({ where: { id: BigInt(params.id) } });
  return { id: params.id };
});
