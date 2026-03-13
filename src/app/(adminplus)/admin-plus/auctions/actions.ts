/**
 * @fileoverview Server Actions para Auction — Admin Plus.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { auctionSchema } from './schema';
import type { AuctionRow } from './types';

function toRow(r: Record<string, unknown>): AuctionRow {
  return {
    id: String(r.id),
    publicId: r.publicId as string | null,
    slug: r.slug as string | null,
    title: String(r.title),
    description: r.description as string | null,
    status: String(r.status),
    auctionType: r.auctionType as string | null,
    auctionMethod: r.auctionMethod as string | null,
    participation: r.participation as string | null,
    auctionDate: r.auctionDate ? String(r.auctionDate) : null,
    endDate: r.endDate ? String(r.endDate) : null,
    totalLots: Number(r.totalLots ?? 0),
    visits: Number(r.visits ?? 0),
    initialOffer: r.initialOffer != null ? Number(r.initialOffer) : null,
    isFeaturedOnMarketplace: Boolean(r.isFeaturedOnMarketplace),
    onlineUrl: r.onlineUrl as string | null,
    address: r.address as string | null,
    zipCode: r.zipCode as string | null,
    supportPhone: r.supportPhone as string | null,
    supportEmail: r.supportEmail as string | null,
    supportWhatsApp: r.supportWhatsApp as string | null,
    auctioneerId: r.auctioneerId ? String(r.auctioneerId) : null,
    auctioneerName: (r.Auctioneer as Record<string, unknown> | null)?.name as string | null ?? null,
    sellerId: r.sellerId ? String(r.sellerId) : null,
    sellerName: (r.Seller as Record<string, unknown> | null)?.name as string | null ?? null,
    categoryId: r.categoryId ? String(r.categoryId) : null,
    categoryName: (r.LotCategory as Record<string, unknown> | null)?.name as string | null ?? null,
    cityId: r.cityId ? String(r.cityId) : null,
    cityName: (r.City as Record<string, unknown> | null)?.name as string | null ?? null,
    stateId: r.stateId ? String(r.stateId) : null,
    stateName: (r.State as Record<string, unknown> | null)?.name as string | null ?? null,
    judicialProcessId: r.judicialProcessId ? String(r.judicialProcessId) : null,
    judicialProcessNumber: (r.JudicialProcess as Record<string, unknown> | null)?.processNumber as string | null ?? null,
    createdAt: r.createdAt ? String(r.createdAt) : null,
  };
}

function generatePublicId(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).substring(2, 6);
  return `AU-${ts}-${rnd}`;
}

export const listAuctions = createAdminAction({
  permissions: ['auctions:list', 'manage_all'],
  handler: async (params, ctx) => {
    const { page = 1, pageSize = 25, search, sortField, sortOrder } = params as Record<string, unknown>;
    const pg = Number(page);
    const ps = Number(pageSize);
    const skip = (pg - 1) * ps;
    const tenantId = ctx.tenantIdBigInt;

    const where: Record<string, unknown> = { tenantId };
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { publicId: { contains: String(search) } },
      ];
    }

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[String(sortField)] = String(sortOrder ?? 'asc');
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        include: {
          Auctioneer: { select: { name: true } },
          Seller: { select: { name: true } },
          LotCategory: { select: { name: true } },
          City: { select: { name: true } },
          State: { select: { name: true } },
          JudicialProcess: { select: { processNumber: true } },
        },
        orderBy,
        skip,
        take: ps,
      }),
      prisma.auction.count({ where }),
    ]);

    return sanitizeResponse({
      data: items.map((r) => toRow(r as unknown as Record<string, unknown>)),
      total,
      page: pg,
      pageSize: ps,
      totalPages: Math.ceil(total / ps),
    });
  },
});

export const createAuction = createAdminAction({
  permissions: ['auctions:create', 'manage_all'],
  schema: auctionSchema,
  handler: async (data, ctx) => {
    const tenantId = ctx.tenantIdBigInt;
    const record = await prisma.auction.create({
      data: {
        publicId: generatePublicId(),
        title: data.title,
        slug: data.slug || null,
        description: data.description || null,
        status: (data.status as never) || 'RASCUNHO',
        auctionType: (data.auctionType as never) || null,
        auctionMethod: (data.auctionMethod as never) || null,
        participation: (data.participation as never) || null,
        auctionDate: data.auctionDate ? new Date(data.auctionDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        initialOffer: data.initialOffer ? Number(data.initialOffer) : null,
        onlineUrl: data.onlineUrl || null,
        address: data.address || null,
        zipCode: data.zipCode || null,
        isFeaturedOnMarketplace: data.isFeaturedOnMarketplace ?? false,
        auctioneerId: data.auctioneerId ? BigInt(data.auctioneerId) : null,
        sellerId: data.sellerId ? BigInt(data.sellerId) : null,
        categoryId: data.categoryId ? BigInt(data.categoryId) : null,
        cityId: data.cityId ? BigInt(data.cityId) : null,
        stateId: data.stateId ? BigInt(data.stateId) : null,
        judicialProcessId: data.judicialProcessId ? BigInt(data.judicialProcessId) : null,
        supportPhone: data.supportPhone || null,
        supportEmail: data.supportEmail || null,
        supportWhatsApp: data.supportWhatsApp || null,
        tenantId,
      },
    });
    return sanitizeResponse(record);
  },
});

export const updateAuction = createAdminAction({
  permissions: ['auctions:update', 'manage_all'],
  handler: async (params, ctx) => {
    const { id, data } = params as { id: string; data: Record<string, unknown> };
    const tenantId = ctx.tenantIdBigInt;
    const record = await prisma.auction.update({
      where: { id: BigInt(id), tenantId },
      data: {
        title: data.title as string,
        slug: (data.slug as string) || null,
        description: (data.description as string) || null,
        status: (data.status as never) || undefined,
        auctionType: (data.auctionType as never) || null,
        auctionMethod: (data.auctionMethod as never) || null,
        participation: (data.participation as never) || null,
        auctionDate: data.auctionDate ? new Date(data.auctionDate as string) : null,
        endDate: data.endDate ? new Date(data.endDate as string) : null,
        initialOffer: data.initialOffer ? Number(data.initialOffer) : null,
        onlineUrl: (data.onlineUrl as string) || null,
        address: (data.address as string) || null,
        zipCode: (data.zipCode as string) || null,
        isFeaturedOnMarketplace: Boolean(data.isFeaturedOnMarketplace),
        auctioneerId: data.auctioneerId ? BigInt(data.auctioneerId as string) : null,
        sellerId: data.sellerId ? BigInt(data.sellerId as string) : null,
        categoryId: data.categoryId ? BigInt(data.categoryId as string) : null,
        cityId: data.cityId ? BigInt(data.cityId as string) : null,
        stateId: data.stateId ? BigInt(data.stateId as string) : null,
        judicialProcessId: data.judicialProcessId ? BigInt(data.judicialProcessId as string) : null,
        supportPhone: (data.supportPhone as string) || null,
        supportEmail: (data.supportEmail as string) || null,
        supportWhatsApp: (data.supportWhatsApp as string) || null,
      },
    });
    return sanitizeResponse(record);
  },
});

export const deleteAuction = createAdminAction({
  permissions: ['auctions:delete', 'manage_all'],
  handler: async (id, ctx) => {
    const tenantId = ctx.tenantIdBigInt;
    await prisma.auction.delete({ where: { id: BigInt(id as string), tenantId } });
    return { deleted: true };
  },
});
