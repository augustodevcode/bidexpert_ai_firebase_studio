/**
 * @fileoverview Server Actions — CRUD de Auctioneer (Leiloeiro) — Admin Plus.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { auctioneerSchema } from './schema';
import { z } from 'zod';

/* ── List ─────────────────────────────────────── */
export const listAuctioneers = createAdminAction({
  inputSchema: z.object({
    page: z.coerce.number().optional().default(1),
    pageSize: z.coerce.number().optional().default(25),
    search: z.string().optional().default(''),
    sortField: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const { page, pageSize, search, sortField, sortOrder } = input;
    const where: Record<string, unknown> = { tenantId: ctx.tenantIdBigInt };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { email: { contains: search } },
        { registrationNumber: { contains: search } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.auctioneer.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auctioneer.count({ where }),
    ]);
    return sanitizeResponse({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  },
});

/* ── Create ───────────────────────────────────── */
export const createAuctioneer = createAdminAction({
  inputSchema: auctioneerSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const record = await prisma.auctioneer.create({
      data: {
        publicId: input.publicId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        registrationNumber: input.registrationNumber ?? null,
        logoUrl: input.logoUrl ?? null,
        logoMediaId: input.logoMediaId ? BigInt(input.logoMediaId) : null,
        dataAiHintLogo: input.dataAiHintLogo ?? null,
        website: input.website ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        supportWhatsApp: input.supportWhatsApp ?? null,
        contactName: input.contactName ?? null,
        address: input.address ?? null,
        addressLink: input.addressLink ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        zipCode: input.zipCode ?? null,
        street: input.street ?? null,
        number: input.number ?? null,
        complement: input.complement ?? null,
        neighborhood: input.neighborhood ?? null,
        cityId: input.cityId ? BigInt(input.cityId) : null,
        stateId: input.stateId ? BigInt(input.stateId) : null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        userId: input.userId ? BigInt(input.userId) : null,
        tenantId: ctx.tenantIdBigInt,
        updatedAt: new Date(),
      },
    });
    return sanitizeResponse(record);
  },
});

/* ── Update ───────────────────────────────────── */
export const updateAuctioneer = createAdminAction({
  inputSchema: auctioneerSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    if (!input.id) throw new Error('ID obrigatório');
    const record = await prisma.auctioneer.update({
      where: { id: BigInt(input.id), tenantId: ctx.tenantIdBigInt },
      data: {
        publicId: input.publicId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        registrationNumber: input.registrationNumber ?? null,
        logoUrl: input.logoUrl ?? null,
        logoMediaId: input.logoMediaId ? BigInt(input.logoMediaId) : null,
        dataAiHintLogo: input.dataAiHintLogo ?? null,
        website: input.website ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        supportWhatsApp: input.supportWhatsApp ?? null,
        contactName: input.contactName ?? null,
        address: input.address ?? null,
        addressLink: input.addressLink ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        zipCode: input.zipCode ?? null,
        street: input.street ?? null,
        number: input.number ?? null,
        complement: input.complement ?? null,
        neighborhood: input.neighborhood ?? null,
        cityId: input.cityId ? BigInt(input.cityId) : null,
        stateId: input.stateId ? BigInt(input.stateId) : null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        userId: input.userId ? BigInt(input.userId) : null,
      },
    });
    return sanitizeResponse(record);
  },
});

/* ── Delete ───────────────────────────────────── */
export const deleteAuctioneer = createAdminAction({
  inputSchema: z.object({ id: z.string() }),
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    await prisma.auctioneer.delete({
      where: { id: BigInt(input.id), tenantId: ctx.tenantIdBigInt },
    });
    return { deleted: true };
  },
});
