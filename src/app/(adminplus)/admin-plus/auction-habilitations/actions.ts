/**
 * Server actions para AuctionHabilitation (CRUD Admin Plus).
 * Composite PK: userId + auctionId.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import type { PaginatedResponse } from '@/lib/admin-plus/types';
import type { AuctionHabilitationRow } from './types';

const FK_INCLUDE = {
  User: { select: { name: true } },
  Auction: { select: { title: true } },
};

function toRow(r: Record<string, unknown>): AuctionHabilitationRow {
  const user = (r.User as Record<string, unknown>) ?? {};
  const auction = (r.Auction as Record<string, unknown>) ?? {};
  return {
    userId: String(r.userId),
    userName: user.name ? String(user.name) : '',
    auctionId: String(r.auctionId),
    auctionTitle: auction.title ? String(auction.title) : '',
    habilitatedAt: r.habilitatedAt ? new Date(r.habilitatedAt as string).toISOString() : new Date().toISOString(),
  };
}

export const listAuctionHabilitations = createAdminAction<
  { page?: number; pageSize?: number; search?: string; sortField?: string; sortOrder?: string },
  PaginatedResponse<AuctionHabilitationRow>
>(async (ctx, input) => {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const skip = (page - 1) * pageSize;
  const search = input.search?.trim();

  const where: Record<string, unknown> = { tenantId: ctx.tenantIdBigInt };
  if (search) {
    where.OR = [
      { User: { name: { contains: search } } },
      { Auction: { title: { contains: search } } },
    ];
  }

  const orderBy: Record<string, string> = {};
  if (input.sortField) orderBy[input.sortField] = input.sortOrder === 'asc' ? 'asc' : 'desc';
  else orderBy.habilitatedAt = 'desc';

  const [items, total] = await Promise.all([
    prisma.auctionHabilitation.findMany({ where, include: FK_INCLUDE, skip, take: pageSize, orderBy }),
    prisma.auctionHabilitation.count({ where }),
  ]);

  const data = sanitizeResponse(items).map(toRow);
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
});

export const createAuctionHabilitation = createAdminAction<Record<string, unknown>, AuctionHabilitationRow>(
  async (ctx, input) => {
    const record = await prisma.auctionHabilitation.create({
      data: {
        userId: BigInt(input.userId as string),
        auctionId: BigInt(input.auctionId as string),
        tenantId: ctx.tenantIdBigInt,
      },
      include: FK_INCLUDE,
    });
    return toRow(sanitizeResponse(record));
  }
);

export const updateAuctionHabilitation = createAdminAction<Record<string, unknown>, AuctionHabilitationRow>(
  async (ctx, input) => {
    const userId = BigInt(input.userId as string);
    const auctionId = BigInt(input.auctionId as string);
    const record = await prisma.auctionHabilitation.update({
      where: { userId_auctionId: { userId, auctionId }, tenantId: ctx.tenantIdBigInt },
      data: { habilitatedAt: new Date() },
      include: FK_INCLUDE,
    });
    return toRow(sanitizeResponse(record));
  }
);

export const deleteAuctionHabilitation = createAdminAction<{ userId: string; auctionId: string }, { userId: string; auctionId: string }>(
  async (ctx, input) => {
    await prisma.auctionHabilitation.delete({
      where: {
        userId_auctionId: { userId: BigInt(input.userId), auctionId: BigInt(input.auctionId) },
        tenantId: ctx.tenantIdBigInt,
      },
    });
    return { userId: input.userId, auctionId: input.auctionId };
  }
);
