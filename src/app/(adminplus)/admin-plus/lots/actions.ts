/**
 * Server actions for the Lot entity (Admin Plus CRUD).
 * 7 FK includes (Auction, Auctioneer, LotCategory, City, Seller, State, Subcategory).
 * Auto-generates publicId with "LT-" prefix.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import type { PaginatedResponse } from '@/lib/admin-plus/types';
import { type LotStatus, type LotSaleMode } from '@prisma/client';
import type { LotRow } from './types';

function generatePublicId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LT-${ts}-${rand}`;
}

function toRow(r: Record<string, unknown>): LotRow {
  const lot = r as Record<string, unknown>;
  const auction = (lot.Auction as Record<string, unknown>) ?? {};
  const auctioneer = (lot.Auctioneer as Record<string, unknown>) ?? {};
  const category = (lot.LotCategory as Record<string, unknown>) ?? {};
  const subcategory = (lot.Subcategory as Record<string, unknown>) ?? {};
  const city = (lot.City as Record<string, unknown>) ?? {};
  const state = (lot.State as Record<string, unknown>) ?? {};
  const seller = (lot.Seller as Record<string, unknown>) ?? {};

  return {
    id: String(lot.id),
    publicId: String(lot.publicId ?? ''),
    title: String(lot.title ?? ''),
    number: lot.number != null ? Number(lot.number) : null,
    slug: lot.slug ? String(lot.slug) : null,
    price: Number(lot.price ?? 0),
    initialPrice: lot.initialPrice != null ? Number(lot.initialPrice) : null,
    secondInitialPrice: lot.secondInitialPrice != null ? Number(lot.secondInitialPrice) : null,
    bidIncrementStep: lot.bidIncrementStep != null ? Number(lot.bidIncrementStep) : null,
    status: String(lot.status ?? 'EM_BREVE'),
    saleMode: lot.saleMode ? String(lot.saleMode) : null,
    type: String(lot.type ?? ''),
    condition: lot.condition ? String(lot.condition) : null,
    imageUrl: lot.imageUrl ? String(lot.imageUrl) : null,
    description: lot.description ? String(lot.description) : null,
    auctionId: String(lot.auctionId ?? ''),
    auctionTitle: auction.title ? String(auction.title) : '',
    auctioneerId: lot.auctioneerId ? String(lot.auctioneerId) : null,
    auctioneerName: auctioneer.name ? String(auctioneer.name) : null,
    lotCategoryId: lot.lotCategoryId ? String(lot.lotCategoryId) : null,
    categoryName: category.name ? String(category.name) : null,
    subcategoryId: lot.subcategoryId ? String(lot.subcategoryId) : null,
    subcategoryName: subcategory.name ? String(subcategory.name) : null,
    cityId: lot.cityId ? String(lot.cityId) : null,
    cityName: lot.cityName ? String(lot.cityName) : (city.name ? String(city.name) : null),
    stateId: lot.stateId ? String(lot.stateId) : null,
    stateName: state.name ? String(state.name) : null,
    stateUf: lot.stateUf ? String(lot.stateUf) : (state.uf ? String(state.uf) : null),
    sellerId: lot.sellerId ? String(lot.sellerId) : null,
    sellerName: seller.name ? String(seller.name) : null,
    mapAddress: lot.mapAddress ? String(lot.mapAddress) : null,
    latitude: lot.latitude != null ? Number(lot.latitude) : null,
    longitude: lot.longitude != null ? Number(lot.longitude) : null,
    requiresDepositGuarantee: Boolean(lot.requiresDepositGuarantee),
    depositGuaranteeAmount: lot.depositGuaranteeAmount != null ? Number(lot.depositGuaranteeAmount) : null,
    depositGuaranteeInfo: lot.depositGuaranteeInfo ? String(lot.depositGuaranteeInfo) : null,
    isFeatured: Boolean(lot.isFeatured),
    isExclusive: Boolean(lot.isExclusive),
    discountPercentage: lot.discountPercentage != null ? Number(lot.discountPercentage) : null,
    bidsCount: Number(lot.bidsCount ?? 0),
    views: Number(lot.views ?? 0),
    createdAt: lot.createdAt ? new Date(lot.createdAt as string).toISOString() : new Date().toISOString(),
    updatedAt: lot.updatedAt ? new Date(lot.updatedAt as string).toISOString() : new Date().toISOString(),
  };
}

const FK_INCLUDE = {
  Auction: { select: { id: true, title: true } },
  Auctioneer: { select: { id: true, name: true } },
  LotCategory: { select: { id: true, name: true } },
  Subcategory: { select: { id: true, name: true } },
  City: { select: { id: true, name: true } },
  State: { select: { id: true, name: true, uf: true } },
  Seller: { select: { id: true, name: true } },
};

export const listLots = createAdminAction<
  { page?: number; pageSize?: number; search?: string; sortField?: string; sortOrder?: string },
  PaginatedResponse<LotRow>
>(async (ctx, input) => {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const skip = (page - 1) * pageSize;
  const search = input.search?.trim();

  const where: Record<string, unknown> = { tenantId: ctx.tenantIdBigInt };
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { publicId: { contains: search } },
    ];
  }

  const orderBy: Record<string, string> = {};
  if (input.sortField) {
    orderBy[input.sortField] = input.sortOrder === 'asc' ? 'asc' : 'desc';
  } else {
    orderBy.createdAt = 'desc';
  }

  const [items, total] = await Promise.all([
    prisma.lot.findMany({
      where,
      include: FK_INCLUDE,
      skip,
      take: pageSize,
      orderBy,
    }),
    prisma.lot.count({ where }),
  ]);

  const data = sanitizeResponse(items).map(toRow);
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
});

export const createLot = createAdminAction<Record<string, unknown>, LotRow>(
  async (ctx, input) => {
    const record = await prisma.lot.create({
      data: {
        publicId: generatePublicId(),
        title: String(input.title),
        number: input.number != null ? String(input.number) : undefined,
        description: input.description ? String(input.description) : undefined,
        slug: input.slug ? String(input.slug) : undefined,
        price: Number(input.price),
        initialPrice: input.initialPrice != null && input.initialPrice !== '' ? Number(input.initialPrice) : undefined,
        secondInitialPrice: input.secondInitialPrice != null && input.secondInitialPrice !== '' ? Number(input.secondInitialPrice) : undefined,
        bidIncrementStep: input.bidIncrementStep != null && input.bidIncrementStep !== '' ? Number(input.bidIncrementStep) : undefined,
        status: ((input.status as string) || 'EM_BREVE') as LotStatus,
        saleMode: input.saleMode ? ((input.saleMode as string) as LotSaleMode) : undefined,
        type: String(input.type),
        condition: input.condition ? String(input.condition) : undefined,
        imageUrl: input.imageUrl ? String(input.imageUrl) : undefined,
        auctionId: BigInt(input.auctionId as string),
        auctioneerId: input.auctioneerId ? BigInt(input.auctioneerId as string) : undefined,
        lotCategoryId: input.lotCategoryId ? BigInt(input.lotCategoryId as string) : undefined,
        subcategoryId: input.subcategoryId ? BigInt(input.subcategoryId as string) : undefined,
        cityId: input.cityId ? BigInt(input.cityId as string) : undefined,
        stateId: input.stateId ? BigInt(input.stateId as string) : undefined,
        sellerId: input.sellerId ? BigInt(input.sellerId as string) : undefined,
        cityName: input.cityName ? String(input.cityName) : undefined,
        stateUf: input.stateUf ? String(input.stateUf) : undefined,
        mapAddress: input.mapAddress ? String(input.mapAddress) : undefined,
        latitude: input.latitude != null && input.latitude !== '' ? Number(input.latitude) : undefined,
        longitude: input.longitude != null && input.longitude !== '' ? Number(input.longitude) : undefined,
        requiresDepositGuarantee: Boolean(input.requiresDepositGuarantee),
        depositGuaranteeAmount: input.depositGuaranteeAmount != null && input.depositGuaranteeAmount !== '' ? Number(input.depositGuaranteeAmount) : undefined,
        depositGuaranteeInfo: input.depositGuaranteeInfo ? String(input.depositGuaranteeInfo) : undefined,
        isFeatured: Boolean(input.isFeatured),
        isExclusive: Boolean(input.isExclusive),
        discountPercentage: input.discountPercentage != null && input.discountPercentage !== '' ? Number(input.discountPercentage) : undefined,
        tenantId: ctx.tenantIdBigInt,
      },
      include: FK_INCLUDE,
    });
    return toRow(sanitizeResponse(record));
  }
);

export const updateLot = createAdminAction<Record<string, unknown>, LotRow>(
  async (ctx, input) => {
    const id = BigInt(input.id as string);
    const data: Record<string, unknown> = {};

    if (input.title !== undefined) data.title = String(input.title);
    if (input.number !== undefined) data.number = input.number != null ? String(input.number) : null;
    if (input.description !== undefined) data.description = input.description ? String(input.description) : null;
    if (input.slug !== undefined) data.slug = input.slug ? String(input.slug) : null;
    if (input.price !== undefined) data.price = Number(input.price);
    if (input.initialPrice !== undefined) data.initialPrice = input.initialPrice != null && input.initialPrice !== '' ? Number(input.initialPrice) : null;
    if (input.secondInitialPrice !== undefined) data.secondInitialPrice = input.secondInitialPrice != null && input.secondInitialPrice !== '' ? Number(input.secondInitialPrice) : null;
    if (input.bidIncrementStep !== undefined) data.bidIncrementStep = input.bidIncrementStep != null && input.bidIncrementStep !== '' ? Number(input.bidIncrementStep) : null;
    if (input.status !== undefined) data.status = (input.status as string) as LotStatus;
    if (input.saleMode !== undefined) data.saleMode = input.saleMode ? ((input.saleMode as string) as LotSaleMode) : null;
    if (input.type !== undefined) data.type = String(input.type);
    if (input.condition !== undefined) data.condition = input.condition ? String(input.condition) : null;
    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl ? String(input.imageUrl) : null;
    if (input.auctionId !== undefined) data.auctionId = BigInt(input.auctionId as string);
    if (input.auctioneerId !== undefined) data.auctioneerId = input.auctioneerId ? BigInt(input.auctioneerId as string) : null;
    if (input.lotCategoryId !== undefined) data.lotCategoryId = input.lotCategoryId ? BigInt(input.lotCategoryId as string) : null;
    if (input.subcategoryId !== undefined) data.subcategoryId = input.subcategoryId ? BigInt(input.subcategoryId as string) : null;
    if (input.cityId !== undefined) data.cityId = input.cityId ? BigInt(input.cityId as string) : null;
    if (input.stateId !== undefined) data.stateId = input.stateId ? BigInt(input.stateId as string) : null;
    if (input.sellerId !== undefined) data.sellerId = input.sellerId ? BigInt(input.sellerId as string) : null;
    if (input.cityName !== undefined) data.cityName = input.cityName ? String(input.cityName) : null;
    if (input.stateUf !== undefined) data.stateUf = input.stateUf ? String(input.stateUf) : null;
    if (input.mapAddress !== undefined) data.mapAddress = input.mapAddress ? String(input.mapAddress) : null;
    if (input.latitude !== undefined) data.latitude = input.latitude != null && input.latitude !== '' ? Number(input.latitude) : null;
    if (input.longitude !== undefined) data.longitude = input.longitude != null && input.longitude !== '' ? Number(input.longitude) : null;
    if (input.requiresDepositGuarantee !== undefined) data.requiresDepositGuarantee = Boolean(input.requiresDepositGuarantee);
    if (input.depositGuaranteeAmount !== undefined) data.depositGuaranteeAmount = input.depositGuaranteeAmount != null && input.depositGuaranteeAmount !== '' ? Number(input.depositGuaranteeAmount) : null;
    if (input.depositGuaranteeInfo !== undefined) data.depositGuaranteeInfo = input.depositGuaranteeInfo ? String(input.depositGuaranteeInfo) : null;
    if (input.isFeatured !== undefined) data.isFeatured = Boolean(input.isFeatured);
    if (input.isExclusive !== undefined) data.isExclusive = Boolean(input.isExclusive);
    if (input.discountPercentage !== undefined) data.discountPercentage = input.discountPercentage != null && input.discountPercentage !== '' ? Number(input.discountPercentage) : null;

    const record = await prisma.lot.update({
      where: { id, tenantId: ctx.tenantIdBigInt },
      data,
      include: FK_INCLUDE,
    });
    return toRow(sanitizeResponse(record));
  }
);

export const deleteLot = createAdminAction<{ id: string }, { id: string }>(
  async (ctx, input) => {
    const id = BigInt(input.id);
    await prisma.lot.delete({ where: { id, tenantId: ctx.tenantIdBigInt } });
    return { id: input.id };
  }
);
