/**
 * Server actions para LotStagePrice CRUD.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { lotStagePriceSchema } from './schema';
import type { LotStagePriceRow } from './types';

const FK_INCLUDE = {
  Lot: { select: { id: true, title: true } },
  Auction: { select: { id: true, title: true } },
  AuctionStage: { select: { id: true, title: true } },
} as const;

function toRow(d: any): LotStagePriceRow {
  return {
    id: d.id.toString(),
    lotId: d.lotId.toString(),
    lotTitle: d.Lot?.title ?? '',
    auctionId: d.auctionId.toString(),
    auctionTitle: d.Auction?.title ?? '',
    auctionStageId: d.auctionStageId.toString(),
    auctionStageTitle: d.AuctionStage?.title ?? '',
    initialBid: d.initialBid != null ? Number(d.initialBid) : null,
    bidIncrement: d.bidIncrement != null ? Number(d.bidIncrement) : null,
  };
}

export const listLotStagePrices = createAdminAction(async (ctx, params?: { page?: number; pageSize?: number; search?: string; sortField?: string; sortOrder?: string }) => {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const where: any = { tenantId: ctx.tenantIdBigInt };
  const [data, total] = await Promise.all([
    prisma.lotStagePrice.findMany({ where, include: FK_INCLUDE, skip: (page - 1) * pageSize, take: pageSize, orderBy: { [params?.sortField ?? 'id']: params?.sortOrder ?? 'desc' } }),
    prisma.lotStagePrice.count({ where }),
  ]);
  return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

export const createLotStagePrice = createAdminAction(async (ctx, input: unknown) => {
  const parsed = lotStagePriceSchema.parse(input);
  const created = await prisma.lotStagePrice.create({
    data: {
      lotId: BigInt(parsed.lotId),
      auctionId: BigInt(parsed.auctionId),
      auctionStageId: BigInt(parsed.auctionStageId),
      initialBid: parsed.initialBid ? parseFloat(parsed.initialBid) : null,
      bidIncrement: parsed.bidIncrement ? parseFloat(parsed.bidIncrement) : null,
      tenantId: ctx.tenantIdBigInt,
    },
    include: FK_INCLUDE,
  });
  return sanitizeResponse(toRow(created));
});

export const updateLotStagePrice = createAdminAction(async (ctx, input: unknown) => {
  const { id, ...rest } = input as any;
  const valid = lotStagePriceSchema.parse(rest);
  const updated = await prisma.lotStagePrice.update({
    where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt },
    data: {
      lotId: BigInt(valid.lotId),
      auctionId: BigInt(valid.auctionId),
      auctionStageId: BigInt(valid.auctionStageId),
      initialBid: valid.initialBid ? parseFloat(valid.initialBid) : null,
      bidIncrement: valid.bidIncrement ? parseFloat(valid.bidIncrement) : null,
    },
    include: FK_INCLUDE,
  });
  return sanitizeResponse(toRow(updated));
});

export const deleteLotStagePrice = createAdminAction(async (ctx, input: unknown) => {
  const { id } = input as any;
  await prisma.lotStagePrice.delete({ where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt } });
  return { deleted: true };
});
