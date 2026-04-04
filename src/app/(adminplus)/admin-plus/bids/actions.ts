/**
 * Server actions for the Bid entity (Admin Plus CRUD).
 * FK includes: Lot (title), Auction (title), User (fullName).
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import type { PaginatedResponse } from '@/lib/admin-plus/types';
import { type BidStatus, type BidOrigin } from '@prisma/client';
import type { BidRow } from './types';

function toRow(r: Record<string, unknown>): BidRow {
  const lot = (r.Lot as Record<string, unknown>) ?? {};
  const auction = (r.Auction as Record<string, unknown>) ?? {};
  const user = (r.User as Record<string, unknown>) ?? {};
  return {
    id: String(r.id),
    lotId: String(r.lotId),
    lotTitle: lot.title ? String(lot.title) : '',
    auctionId: String(r.auctionId),
    auctionTitle: auction.title ? String(auction.title) : '',
    bidderId: String(r.bidderId),
    bidderName: user.fullName ? String(user.fullName) : '',
    amount: Number(r.amount ?? 0),
    status: String(r.status ?? 'ATIVO'),
    bidOrigin: String(r.bidOrigin ?? 'MANUAL'),
    isAutoBid: Boolean(r.isAutoBid),
    bidderDisplay: r.bidderDisplay ? String(r.bidderDisplay) : null,
    bidderAlias: r.bidderAlias ? String(r.bidderAlias) : null,
    timestamp: r.timestamp ? new Date(r.timestamp as string).toISOString() : new Date().toISOString(),
    cancelledAt: r.cancelledAt ? new Date(r.cancelledAt as string).toISOString() : null,
    createdAt: r.timestamp ? new Date(r.timestamp as string).toISOString() : new Date().toISOString(),
  };
}

const FK_INCLUDE = {
  Lot: { select: { id: true, title: true } },
  Auction: { select: { id: true, title: true } },
  User: { select: { id: true, fullName: true } },
};

export const listBids = createAdminAction<
  { page?: number; pageSize?: number; search?: string; sortField?: string; sortOrder?: string },
  PaginatedResponse<BidRow>
>(async (ctx, input) => {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const skip = (page - 1) * pageSize;
  const search = input.search?.trim();

  const where: Record<string, unknown> = { tenantId: ctx.tenantIdBigInt };
  if (search) {
    where.OR = [
      { Lot: { title: { contains: search } } },
      { User: { name: { contains: search } } },
    ];
  }

  const orderBy: Record<string, string> = {};
  if (input.sortField) {
    orderBy[input.sortField] = input.sortOrder === 'asc' ? 'asc' : 'desc';
  } else {
    orderBy.timestamp = 'desc';
  }

  const [items, total] = await Promise.all([
    prisma.bid.findMany({ where, include: FK_INCLUDE, skip, take: pageSize, orderBy }),
    prisma.bid.count({ where }),
  ]);

  const data = sanitizeResponse(items).map(toRow);
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
});

export const createBid = createAdminAction<Record<string, unknown>, BidRow>(
  async (ctx, input) => {
    const record = await prisma.bid.create({
      data: {
        lotId: BigInt(input.lotId as string),
        auctionId: BigInt(input.auctionId as string),
        bidderId: BigInt(input.bidderId as string),
        amount: Number(input.amount),
        status: ((input.status as string) || 'ATIVO') as BidStatus,
        bidOrigin: ((input.bidOrigin as string) || 'MANUAL') as BidOrigin,
        isAutoBid: Boolean(input.isAutoBid),
        bidderDisplay: input.bidderDisplay ? String(input.bidderDisplay) : undefined,
        bidderAlias: input.bidderAlias ? String(input.bidderAlias) : undefined,
        tenantId: ctx.tenantIdBigInt,
      },
      include: FK_INCLUDE,
    });
    return toRow(sanitizeResponse(record));
  }
);

export const updateBid = createAdminAction<Record<string, unknown>, BidRow>(
  async (ctx, input) => {
    const id = BigInt(input.id as string);
    const data: Record<string, unknown> = {};

    if (input.lotId !== undefined) data.lotId = BigInt(input.lotId as string);
    if (input.auctionId !== undefined) data.auctionId = BigInt(input.auctionId as string);
    if (input.bidderId !== undefined) data.bidderId = BigInt(input.bidderId as string);
    if (input.amount !== undefined) data.amount = Number(input.amount);
    if (input.status !== undefined) data.status = input.status as string;
    if (input.bidOrigin !== undefined) data.bidOrigin = input.bidOrigin as string;
    if (input.isAutoBid !== undefined) data.isAutoBid = Boolean(input.isAutoBid);
    if (input.bidderDisplay !== undefined) data.bidderDisplay = input.bidderDisplay ? String(input.bidderDisplay) : null;
    if (input.bidderAlias !== undefined) data.bidderAlias = input.bidderAlias ? String(input.bidderAlias) : null;

    const record = await prisma.bid.update({
      where: { id, tenantId: ctx.tenantIdBigInt },
      data,
      include: FK_INCLUDE,
    });
    return toRow(sanitizeResponse(record));
  }
);

export const deleteBid = createAdminAction<{ id: string }, { id: string }>(
  async (ctx, input) => {
    const id = BigInt(input.id);
    await prisma.bid.delete({ where: { id, tenantId: ctx.tenantIdBigInt } });
    return { id: input.id };
  }
);
