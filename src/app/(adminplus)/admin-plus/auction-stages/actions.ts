/**
 * @fileoverview Server Actions para AuctionStage — Admin Plus.
 */
'use server';

import { type AuctionStage_status } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { sanitizeResponse } from '@/lib/serialization-helper';
import type { AuctionStageRow } from './types';

function toRow(r: Record<string, unknown>): AuctionStageRow {
  return {
    id: String(r.id),
    name: String(r.name ?? ''),
    startDate: r.startDate ? new Date(r.startDate as string).toISOString() : '',
    endDate: r.endDate ? new Date(r.endDate as string).toISOString() : '',
    status: String(r.status ?? ''),
    discountPercent: Number(r.discountPercent ?? 100),
    auctionId: r.auctionId ? String(r.auctionId) : '',
    auctionTitle: (r as Record<string, Record<string, unknown>>).Auction?.title
      ? String((r as Record<string, Record<string, unknown>>).Auction.title)
      : '',
  };
}

export const listAuctionStages = createAdminAction(async (ctx, params: { page: number; pageSize: number; search?: string; sortField?: string; sortOrder?: string }) => {
  const { page, pageSize, search, sortField, sortOrder } = params;
  const where: Record<string, unknown> = { tenantId: ctx.tenantIdBigInt };
  if (search) {
    where.OR = [
      { name: { contains: search } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.auctionStage.findMany({
      where,
      include: { Auction: { select: { title: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: sortField ? { [sortField]: sortOrder ?? 'asc' } : { startDate: 'desc' },
    }),
    prisma.auctionStage.count({ where }),
  ]);
  return sanitizeResponse({ data: data.map((d) => toRow(d as unknown as Record<string, unknown>)), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

export const createAuctionStage = createAdminAction(async (ctx, values: Record<string, unknown>) => {
  const rec = await prisma.auctionStage.create({
    data: {
      name: String(values.name),
      startDate: new Date(String(values.startDate)),
      endDate: new Date(String(values.endDate)),
      status: ((values.status as string) || 'AGUARDANDO_INICIO') as AuctionStage_status,
      discountPercent: values.discountPercent ? Number(values.discountPercent) : 100,
      auctionId: values.auctionId ? BigInt(values.auctionId as string) : BigInt(0),
      tenantId: ctx.tenantIdBigInt,
    },
  });
  return sanitizeResponse(rec);
});

export const updateAuctionStage = createAdminAction(async (ctx, ...args: unknown[]) => {
  const id = args[0] as string;
  const values = args[1] as Record<string, unknown>;
  const data: Record<string, unknown> = {
    name: String(values.name),
    startDate: new Date(String(values.startDate)),
    endDate: new Date(String(values.endDate)),
  };
  if (values.status) data.status = values.status;
  if (values.discountPercent) data.discountPercent = Number(values.discountPercent);
  if (values.auctionId) data.auctionId = BigInt(values.auctionId as string);
  const rec = await prisma.auctionStage.update({
    where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt },
    data,
  });
  return sanitizeResponse(rec);
});

export const deleteAuctionStage = createAdminAction(async (ctx, id: string) => {
  await prisma.auctionStage.delete({ where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt } });
  return { deleted: true };
});
