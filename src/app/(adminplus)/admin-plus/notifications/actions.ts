/**
 * Server Actions para CRUD de Notification (Notificações).
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { notificationSchema } from './schema';
import type { NotificationRow } from './types';

function toRow(r: any): NotificationRow {
  return {
    id: r.id.toString(),
    userId: r.userId.toString(),
    userName: r.User?.fullName || r.User?.email || '—',
    message: r.message,
    link: r.link ?? '',
    isRead: r.isRead,
    lotId: r.lotId?.toString() ?? '',
    auctionId: r.auctionId?.toString() ?? '',
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
  };
}

export const listNotifications = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ page = 1, pageSize = 10, search = '', sortField, sortOrder }, ctx) => {
    const where: any = { tenantId: ctx.tenantIdBigInt };
    if (search) {
      where.OR = [
        { message: { contains: search } },
        { User: { fullName: { contains: search } } },
      ];
    }
    const orderBy = sortField ? { [sortField]: sortOrder || 'asc' } : { createdAt: 'desc' as const };
    const [data, total] = await Promise.all([
      prisma.notification.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: { User: { select: { fullName: true, email: true } } } }),
      prisma.notification.count({ where }),
    ]);
    return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  },
});

export const getNotification = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ id }: { id: string }) => {
    const r = await prisma.notification.findUniqueOrThrow({ where: { id: BigInt(id) }, include: { User: { select: { fullName: true, email: true } } } });
    return sanitizeResponse(toRow(r));
  },
});

export const createNotification = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async (input: Record<string, unknown>, ctx) => {
    const parsed = notificationSchema.parse(input);
    const r = await prisma.notification.create({
      data: {
        userId: BigInt(parsed.userId),
        message: parsed.message,
        link: parsed.link || null,
        isRead: parsed.isRead ?? false,
        lotId: parsed.lotId ? BigInt(parsed.lotId) : null,
        auctionId: parsed.auctionId ? BigInt(parsed.auctionId) : null,
        tenantId: ctx.tenantIdBigInt,
      },
      include: { User: { select: { fullName: true, email: true } } },
    });
    return sanitizeResponse(toRow(r));
  },
});

export const updateNotification = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async (input: Record<string, unknown>) => {
    const { id, ...rest } = input as any;
    const parsed = notificationSchema.parse(rest);
    const r = await prisma.notification.update({
      where: { id: BigInt(id) },
      data: {
        userId: BigInt(parsed.userId),
        message: parsed.message,
        link: parsed.link || null,
        isRead: parsed.isRead ?? false,
        lotId: parsed.lotId ? BigInt(parsed.lotId) : null,
        auctionId: parsed.auctionId ? BigInt(parsed.auctionId) : null,
      },
      include: { User: { select: { fullName: true, email: true } } },
    });
    return sanitizeResponse(toRow(r));
  },
});

export const deleteNotification = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ id }: { id: string }) => {
    await prisma.notification.delete({ where: { id: BigInt(id) } });
    return { deleted: true };
  },
});
