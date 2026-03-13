/**
 * Server Actions CRUD para WonLot (Lotes Arrematados) no Admin Plus.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { wonLotSchema } from './schema';
import type { WonLotRow } from './types';

function toRow(r: any): WonLotRow {
  return {
    id: r.id.toString(),
    bidderId: r.bidderId?.toString() ?? '',
    bidderName: r.BidderProfile?.User?.name ?? r.BidderProfile?.id?.toString() ?? '',
    lotId: r.lotId?.toString() ?? '',
    auctionId: r.auctionId?.toString() ?? '',
    title: r.title ?? '',
    finalBid: r.finalBid != null ? parseFloat(r.finalBid.toString()).toFixed(2) : '0.00',
    totalAmount: r.totalAmount != null ? parseFloat(r.totalAmount.toString()).toFixed(2) : '0.00',
    paidAmount: r.paidAmount != null ? parseFloat(r.paidAmount.toString()).toFixed(2) : '0.00',
    status: r.status ?? '',
    paymentStatus: r.paymentStatus ?? '',
    deliveryStatus: r.deliveryStatus ?? '',
    wonAt: r.wonAt?.toISOString?.() ?? String(r.wonAt ?? ''),
    dueDate: r.dueDate?.toISOString?.() ?? '',
    trackingCode: r.trackingCode ?? '',
    invoiceUrl: r.invoiceUrl ?? '',
    receiptUrl: r.receiptUrl ?? '',
    createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt),
    updatedAt: r.updatedAt?.toISOString?.() ?? String(r.updatedAt),
  };
}

const includeRelations = { BidderProfile: { include: { User: { select: { name: true } } } } };

/* ───── LIST ───── */
export const listWonLots = createAdminAction(async (ctx, params?: { page?: number; pageSize?: number; sortField?: string; sortDirection?: string; search?: string }) => {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const search = params?.search?.trim() ?? '';
  const orderBy: any = { [params?.sortField ?? 'createdAt']: params?.sortDirection ?? 'desc' };

  const where: any = { tenantId: ctx.tenantIdBigInt };
  if (search) {
    where.AND = [{ OR: [{ title: { contains: search } }] }];
  }

  const [data, total] = await Promise.all([
    prisma.wonLot.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: includeRelations }),
    prisma.wonLot.count({ where }),
  ]);

  return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

/* ───── GET ───── */
export const getWonLot = createAdminAction(async (ctx, params: { id: string }) => {
  const record = await prisma.wonLot.findUnique({ where: { id: BigInt(params.id) }, include: includeRelations });
  if (!record) throw new Error('Registro não encontrado');
  return sanitizeResponse(toRow(record));
});

/* ───── CREATE ───── */
export const createWonLot = createAdminAction(async (ctx, data: unknown) => {
  const parsed = wonLotSchema.parse(data);
  const record = await prisma.wonLot.create({
    data: {
      bidderId: BigInt(parsed.bidderId),
      lotId: BigInt(parsed.lotId),
      auctionId: BigInt(parsed.auctionId),
      title: parsed.title,
      finalBid: parseFloat(parsed.finalBid),
      totalAmount: parseFloat(parsed.totalAmount),
      paidAmount: parsed.paidAmount ? parseFloat(parsed.paidAmount) : 0,
      status: parsed.status as any,
      paymentStatus: parsed.paymentStatus as any,
      deliveryStatus: parsed.deliveryStatus as any,
      wonAt: parsed.wonAt ? new Date(parsed.wonAt) : new Date(),
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      trackingCode: parsed.trackingCode || null,
      invoiceUrl: parsed.invoiceUrl || null,
      receiptUrl: parsed.receiptUrl || null,
      tenantId: ctx.tenantIdBigInt,
      updatedAt: new Date(),
    },
    include: includeRelations,
  });
  return sanitizeResponse(toRow(record));
});

/* ───── UPDATE ───── */
export const updateWonLot = createAdminAction(async (ctx, { id, data }: { id: string; data: unknown }) => {
  const parsed = wonLotSchema.parse(data);
  const record = await prisma.wonLot.update({
    where: { id: BigInt(id) },
    data: {
      bidderId: BigInt(parsed.bidderId),
      lotId: BigInt(parsed.lotId),
      auctionId: BigInt(parsed.auctionId),
      title: parsed.title,
      finalBid: parseFloat(parsed.finalBid),
      totalAmount: parseFloat(parsed.totalAmount),
      paidAmount: parsed.paidAmount ? parseFloat(parsed.paidAmount) : 0,
      status: parsed.status as any,
      paymentStatus: parsed.paymentStatus as any,
      deliveryStatus: parsed.deliveryStatus as any,
      wonAt: parsed.wonAt ? new Date(parsed.wonAt) : undefined,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      trackingCode: parsed.trackingCode || null,
      invoiceUrl: parsed.invoiceUrl || null,
      receiptUrl: parsed.receiptUrl || null,
    },
    include: includeRelations,
  });
  return sanitizeResponse(toRow(record));
});

/* ───── DELETE ───── */
export const deleteWonLot = createAdminAction(async (ctx, params: { id: string }) => {
  await prisma.wonLot.delete({ where: { id: BigInt(params.id) } });
  return { success: true as const };
});
