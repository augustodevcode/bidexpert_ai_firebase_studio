/**
 * Server Actions CRUD para ParticipationHistory no Admin Plus.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { participationHistorySchema } from './schema';
import type { ParticipationHistoryRow } from './types';

function toRow(r: any): ParticipationHistoryRow {
  return {
    id: r.id.toString(),
    bidderId: r.bidderId?.toString() ?? '',
    bidderName: r.BidderProfile?.User?.name ?? r.BidderProfile?.id?.toString() ?? '',
    lotId: r.lotId?.toString() ?? '',
    auctionId: r.auctionId?.toString() ?? '',
    title: r.title ?? '',
    auctionName: r.auctionName ?? '',
    maxBid: r.maxBid?.toString() ?? '',
    finalBid: r.finalBid?.toString() ?? '',
    result: r.result ?? '',
    bidCount: r.bidCount ?? 0,
    participatedAt: r.participatedAt?.toISOString?.() ?? String(r.participatedAt),
    createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt),
  };
}

const includeRelations = { BidderProfile: { include: { User: { select: { name: true } } } } };

/* ───── LIST ───── */
export const listParticipationHistory = createAdminAction(async (ctx, params?: { page?: number; pageSize?: number; sortField?: string; sortDirection?: string; search?: string }) => {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const search = params?.search?.trim() ?? '';
  const orderBy: any = { [params?.sortField ?? 'createdAt']: params?.sortDirection ?? 'desc' };

  const where: any = { tenantId: ctx.tenantIdBigInt };
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { auctionName: { contains: search } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.participationHistory.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: includeRelations }),
    prisma.participationHistory.count({ where }),
  ]);

  return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

/* ───── GET ───── */
export const getParticipationHistory = createAdminAction(async (ctx, params: { id: string }) => {
  const record = await prisma.participationHistory.findUnique({ where: { id: BigInt(params.id) }, include: includeRelations });
  if (!record) throw new Error('Registro não encontrado');
  return sanitizeResponse(toRow(record));
});

/* ───── CREATE ───── */
export const createParticipationHistory = createAdminAction(async (ctx, data: unknown) => {
  const parsed = participationHistorySchema.parse(data);
  const record = await prisma.participationHistory.create({
    data: {
      bidderId: BigInt(parsed.bidderId),
      lotId: BigInt(parsed.lotId),
      auctionId: BigInt(parsed.auctionId),
      title: parsed.title,
      auctionName: parsed.auctionName,
      maxBid: parsed.maxBid ? parseFloat(parsed.maxBid) : null,
      finalBid: parsed.finalBid ? parseFloat(parsed.finalBid) : null,
      result: parsed.result as any,
      bidCount: parsed.bidCount,
      tenantId: ctx.tenantIdBigInt,
    },
    include: includeRelations,
  });
  return sanitizeResponse(toRow(record));
});

/* ───── UPDATE ───── */
export const updateParticipationHistory = createAdminAction(async (ctx, { id, data }: { id: string; data: unknown }) => {
  const parsed = participationHistorySchema.parse(data);
  const record = await prisma.participationHistory.update({
    where: { id: BigInt(id) },
    data: {
      bidderId: BigInt(parsed.bidderId),
      lotId: BigInt(parsed.lotId),
      auctionId: BigInt(parsed.auctionId),
      title: parsed.title,
      auctionName: parsed.auctionName,
      maxBid: parsed.maxBid ? parseFloat(parsed.maxBid) : null,
      finalBid: parsed.finalBid ? parseFloat(parsed.finalBid) : null,
      result: parsed.result as any,
      bidCount: parsed.bidCount,
    },
    include: includeRelations,
  });
  return sanitizeResponse(toRow(record));
});

/* ───── DELETE ───── */
export const deleteParticipationHistory = createAdminAction(async (ctx, params: { id: string }) => {
  await prisma.participationHistory.delete({ where: { id: BigInt(params.id) } });
  return { success: true as const };
});
