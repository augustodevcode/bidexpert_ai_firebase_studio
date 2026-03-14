/**
 * Server Actions para CRUD de BidderNotification no Admin Plus.
 * Notificações de arrematantes — tenantId nullable.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { sanitizeResponse } from '@/lib/serialization-helper';
import type { BidderNotificationRow } from './types';
import type { BidderNotificationFormData } from './schema';

/* ── helpers ── */
function toRow(r: any): BidderNotificationRow {
  return {
    id: r.id.toString(),
    bidderId: r.bidderId.toString(),
    bidderName: r.BidderProfile?.User?.fullName ?? r.BidderProfile?.fullName ?? '-',
    type: r.type,
    title: r.title,
    message: r.message,
    data: r.data ? JSON.stringify(r.data) : '',
    isRead: r.isRead,
    readAt: r.readAt?.toISOString() ?? '',
    createdAt: r.createdAt?.toISOString() ?? '',
  };
}

const include = { BidderProfile: { include: { User: { select: { fullName: true } } } } };

/* ── list ── */
export const listBidderNotifications = createAdminAction(async (ctx, params: { page: number; pageSize: number; sortField?: string; sortDirection?: string; search?: string }) => {
  const where: any = { OR: [{ tenantId: ctx.tenantIdBigInt }, { tenantId: null }] };
  if (params.search) { where.AND = [{ OR: [{ title: { contains: params.search } }, { type: { contains: params.search } }, { BidderProfile: { User: { fullName: { contains: params.search } } } }] }]; }
  const orderBy = params.sortField ? { [params.sortField]: params.sortDirection || 'asc' } : { createdAt: 'desc' as const };
  const [data, total] = await Promise.all([
    prisma.bidderNotification.findMany({ where, include, orderBy, skip: (params.page - 1) * params.pageSize, take: params.pageSize }),
    prisma.bidderNotification.count({ where }),
  ]);
  return sanitizeResponse({ data: data.map(toRow), total, page: params.page, pageSize: params.pageSize, totalPages: Math.ceil(total / params.pageSize) });
});

/* ── create ── */
export const createBidderNotification = createAdminAction(async (ctx, data: BidderNotificationFormData) => {
  const record = await prisma.bidderNotification.create({
    data: { bidderId: BigInt(data.bidderId), type: data.type as any, title: data.title, message: data.message, data: data.data ? JSON.parse(data.data) : undefined, isRead: data.isRead ?? false, tenantId: ctx.tenantIdBigInt },
    include,
  });
  return sanitizeResponse(toRow(record));
});

/* ── update ── */
export const updateBidderNotification = createAdminAction(async (_ctx, params: { id: string; data: BidderNotificationFormData }) => {
  const record = await prisma.bidderNotification.update({
    where: { id: BigInt(params.id) },
    data: { bidderId: BigInt(params.data.bidderId), type: params.data.type as any, title: params.data.title, message: params.data.message, data: params.data.data ? JSON.parse(params.data.data) : undefined, isRead: params.data.isRead ?? false },
    include,
  });
  return sanitizeResponse(toRow(record));
});

/* ── delete ── */
export const deleteBidderNotification = createAdminAction(async (_ctx, params: { id: string }) => {
  await prisma.bidderNotification.delete({ where: { id: BigInt(params.id) } });
  return { id: params.id };
});
