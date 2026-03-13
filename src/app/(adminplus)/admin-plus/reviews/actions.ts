/**
 * Server Actions para Review. FKs: Lot, Auction, User.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { reviewSchema } from './schema';
import type { ReviewRow } from './types';
import type { PaginatedResponse } from '@/lib/admin-plus/types';
import { z } from 'zod';

function toRow(r: any): ReviewRow {
  return {
    id: r.id.toString(),
    lotId: r.lotId?.toString() ?? '',
    lotTitle: r.Lot?.title ?? '',
    auctionId: r.auctionId?.toString() ?? '',
    auctionTitle: r.Auction?.title ?? '',
    userId: r.userId?.toString() ?? '',
    userName: r.User?.name ?? '',
    rating: r.rating,
    comment: r.comment ?? null,
    userDisplayName: r.userDisplayName,
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
    updatedAt: r.updatedAt?.toISOString?.() ?? r.updatedAt,
  };
}

export const listReviews = createAdminAction(
  z.object({ page: z.number().optional(), pageSize: z.number().optional(), search: z.string().optional(), sortField: z.string().optional(), sortOrder: z.enum(['asc', 'desc']).optional() }),
  async (input, ctx): Promise<PaginatedResponse<ReviewRow>> => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const where: any = { tenantId: ctx.tenantIdBigInt };
    if (input.search) {
      where.OR = [
        { userDisplayName: { contains: input.search } },
        { comment: { contains: input.search } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.review.findMany({ where, include: { Lot: { select: { title: true } }, Auction: { select: { title: true } }, User: { select: { name: true } } }, skip: (page - 1) * pageSize, take: pageSize, orderBy: input.sortField ? { [input.sortField]: input.sortOrder || 'desc' } : { createdAt: 'desc' } }),
      prisma.review.count({ where }),
    ]);
    return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  }
);

export const createReview = createAdminAction(
  reviewSchema,
  async (data, ctx) => {
    const record = await prisma.review.create({ data: { lotId: BigInt(data.lotId), auctionId: BigInt(data.auctionId), userId: BigInt(data.userId), rating: data.rating, comment: data.comment || null, userDisplayName: data.userDisplayName, tenantId: ctx.tenantIdBigInt }, include: { Lot: { select: { title: true } }, Auction: { select: { title: true } }, User: { select: { name: true } } } });
    return sanitizeResponse(toRow(record));
  }
);

export const updateReview = createAdminAction(
  reviewSchema.extend({ id: z.string().min(1) }),
  async (data, ctx) => {
    const record = await prisma.review.update({ where: { id: BigInt(data.id), tenantId: ctx.tenantIdBigInt }, data: { lotId: BigInt(data.lotId), auctionId: BigInt(data.auctionId), userId: BigInt(data.userId), rating: data.rating, comment: data.comment || null, userDisplayName: data.userDisplayName }, include: { Lot: { select: { title: true } }, Auction: { select: { title: true } }, User: { select: { name: true } } } });
    return sanitizeResponse(toRow(record));
  }
);

export const deleteReview = createAdminAction(
  z.object({ id: z.string().min(1) }),
  async (data, ctx) => {
    await prisma.review.delete({ where: { id: BigInt(data.id), tenantId: ctx.tenantIdBigInt } });
    return { deleted: true };
  }
);
