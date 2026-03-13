/**
 * Server Actions para UserLotMaxBid. FKs: User, Lot.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { userLotMaxBidSchema } from './schema';
import type { UserLotMaxBidRow } from './types';
import type { PaginatedResponse } from '@/lib/admin-plus/types';
import { z } from 'zod';

function toRow(r: any): UserLotMaxBidRow {
  return {
    id: r.id.toString(),
    userId: r.userId?.toString() ?? '',
    userName: r.User?.name ?? '',
    lotId: r.lotId?.toString() ?? '',
    lotTitle: r.Lot?.title ?? '',
    maxAmount: Number(r.maxAmount),
    isActive: r.isActive,
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
    updatedAt: r.updatedAt?.toISOString?.() ?? r.updatedAt,
  };
}

const includeRels = { User: { select: { name: true } }, Lot: { select: { title: true } } };

export const listUserLotMaxBids = createAdminAction(
  z.object({ page: z.number().optional(), pageSize: z.number().optional(), search: z.string().optional(), sortField: z.string().optional(), sortOrder: z.enum(['asc', 'desc']).optional() }),
  async (input, ctx): Promise<PaginatedResponse<UserLotMaxBidRow>> => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const where: any = { tenantId: ctx.tenantIdBigInt };
    if (input.search) {
      where.OR = [
        { User: { name: { contains: input.search } } },
        { Lot: { title: { contains: input.search } } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.userLotMaxBid.findMany({ where, include: includeRels, skip: (page - 1) * pageSize, take: pageSize, orderBy: input.sortField ? { [input.sortField]: input.sortOrder || 'desc' } : { createdAt: 'desc' } }),
      prisma.userLotMaxBid.count({ where }),
    ]);
    return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  }
);

export const createUserLotMaxBid = createAdminAction(
  userLotMaxBidSchema,
  async (data, ctx) => {
    const record = await prisma.userLotMaxBid.create({ data: { userId: BigInt(data.userId), lotId: BigInt(data.lotId), maxAmount: data.maxAmount, isActive: data.isActive, tenantId: ctx.tenantIdBigInt }, include: includeRels });
    return sanitizeResponse(toRow(record));
  }
);

export const updateUserLotMaxBid = createAdminAction(
  userLotMaxBidSchema.extend({ id: z.string().min(1) }),
  async (data, ctx) => {
    const record = await prisma.userLotMaxBid.update({ where: { id: BigInt(data.id), tenantId: ctx.tenantIdBigInt }, data: { userId: BigInt(data.userId), lotId: BigInt(data.lotId), maxAmount: data.maxAmount, isActive: data.isActive }, include: includeRels });
    return sanitizeResponse(toRow(record));
  }
);

export const deleteUserLotMaxBid = createAdminAction(
  z.object({ id: z.string().min(1) }),
  async (data, ctx) => {
    await prisma.userLotMaxBid.delete({ where: { id: BigInt(data.id), tenantId: ctx.tenantIdBigInt } });
    return { deleted: true };
  }
);
