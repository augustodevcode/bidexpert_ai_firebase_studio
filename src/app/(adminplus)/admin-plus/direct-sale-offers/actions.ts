/**
 * Server Actions para CRUD de DirectSaleOffer (Ofertas de Venda Direta).
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { directSaleOfferSchema } from './schema';
import type { DirectSaleOfferRow } from './types';

function toRow(r: any): DirectSaleOfferRow {
  return {
    id: r.id.toString(),
    publicId: r.publicId,
    title: r.title,
    description: r.description ?? '',
    offerType: r.offerType,
    price: r.price != null ? Number(r.price) : null,
    minimumOfferPrice: r.minimumOfferPrice != null ? Number(r.minimumOfferPrice) : null,
    status: r.status,
    locationCity: r.locationCity ?? '',
    locationState: r.locationState ?? '',
    imageUrl: r.imageUrl ?? '',
    expiresAt: r.expiresAt?.toISOString?.() ?? r.expiresAt ?? '',
    categoryName: r.LotCategory?.name ?? '—',
    categoryId: r.categoryId?.toString() ?? '',
    sellerName: r.sellerName ?? r.Seller?.name ?? '—',
    sellerId: r.sellerId?.toString() ?? '',
    views: r.views ?? 0,
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
  };
}

export const listDirectSaleOffers = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ page = 1, pageSize = 10, search = '', sortField, sortOrder }, ctx) => {
    const where: any = { tenantId: ctx.tenantIdBigInt };
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { publicId: { contains: search } },
      ];
    }
    const orderBy = sortField ? { [sortField]: sortOrder || 'asc' } : { createdAt: 'desc' as const };
    const [data, total] = await Promise.all([
      prisma.directSaleOffer.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: { LotCategory: { select: { name: true } }, Seller: { select: { name: true } } } }),
      prisma.directSaleOffer.count({ where }),
    ]);
    return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  },
});

export const createDirectSaleOffer = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async (input: Record<string, unknown>, ctx) => {
    const parsed = directSaleOfferSchema.parse(input);
    const count = await prisma.directSaleOffer.count({ where: { tenantId: ctx.tenantIdBigInt } });
    const publicId = `DSO-${String(count + 1).padStart(5, '0')}`;
    const r = await prisma.directSaleOffer.create({
      data: {
        publicId,
        title: parsed.title,
        description: parsed.description || null,
        offerType: parsed.offerType as any,
        price: parsed.price ? parseFloat(parsed.price) : null,
        minimumOfferPrice: parsed.minimumOfferPrice ? parseFloat(parsed.minimumOfferPrice) : null,
        status: parsed.status as any,
        locationCity: parsed.locationCity || null,
        locationState: parsed.locationState || null,
        imageUrl: parsed.imageUrl || null,
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        categoryId: BigInt(parsed.categoryId),
        sellerId: BigInt(parsed.sellerId),
        sellerName: parsed.sellerName || null,
        tenantId: ctx.tenantIdBigInt,
        updatedAt: new Date(),
      },
      include: { LotCategory: { select: { name: true } }, Seller: { select: { name: true } } },
    });
    return sanitizeResponse(toRow(r));
  },
});

export const updateDirectSaleOffer = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async (input: Record<string, unknown>) => {
    const { id, ...rest } = input as any;
    const parsed = directSaleOfferSchema.parse(rest);
    const r = await prisma.directSaleOffer.update({
      where: { id: BigInt(id) },
      data: {
        title: parsed.title,
        description: parsed.description || null,
        offerType: parsed.offerType as any,
        price: parsed.price ? parseFloat(parsed.price) : null,
        minimumOfferPrice: parsed.minimumOfferPrice ? parseFloat(parsed.minimumOfferPrice) : null,
        status: parsed.status as any,
        locationCity: parsed.locationCity || null,
        locationState: parsed.locationState || null,
        imageUrl: parsed.imageUrl || null,
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        categoryId: BigInt(parsed.categoryId),
        sellerId: BigInt(parsed.sellerId),
        sellerName: parsed.sellerName || null,
      },
      include: { LotCategory: { select: { name: true } }, Seller: { select: { name: true } } },
    });
    return sanitizeResponse(toRow(r));
  },
});

export const deleteDirectSaleOffer = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ id }: { id: string }) => {
    await prisma.directSaleOffer.delete({ where: { id: BigInt(id) } });
    return { deleted: true };
  },
});
