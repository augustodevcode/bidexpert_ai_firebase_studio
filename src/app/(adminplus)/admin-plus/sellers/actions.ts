/**
 * @fileoverview Server Actions CRUD para Seller — Admin Plus.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { sellerSchema } from './schema';
import { z } from 'zod';
import type { SellerRow } from './types';

/* ---------- LIST ---------- */
export const listSellers = createAdminAction({
  inputSchema: z.object({
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(25),
    sortField: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
  }),
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const { page, pageSize, sortField, sortOrder, search } = input;
    const skip = (page - 1) * pageSize;

    const where: any = { tenantId: ctx.tenantIdBigInt };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { slug: { contains: search } },
        { contactName: { contains: search } },
      ];
    }

    const orderBy = sortField
      ? { [sortField]: sortOrder ?? 'asc' }
      : { createdAt: 'desc' as const };

    const [raw, total] = await Promise.all([
      prisma.seller.findMany({ where, skip, take: pageSize, orderBy }),
      prisma.seller.count({ where }),
    ]);

    const data: SellerRow[] = raw.map((r) => ({
      id: r.id.toString(),
      publicId: r.publicId,
      name: r.name,
      slug: r.slug,
      description: r.description,
      logoUrl: r.logoUrl,
      email: r.email,
      phone: r.phone,
      contactName: r.contactName,
      city: r.city,
      state: r.state,
      isJudicial: r.isJudicial,
      tenantId: r.tenantId.toString(),
      userId: r.userId?.toString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return sanitizeResponse({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  },
});

/* ---------- CREATE ---------- */
export const createSeller = createAdminAction({
  inputSchema: sellerSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const record = await prisma.seller.create({
      data: {
        publicId: input.publicId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        logoUrl: input.logoUrl,
        logoMediaId: input.logoMediaId ? BigInt(input.logoMediaId) : null,
        dataAiHintLogo: input.dataAiHintLogo,
        website: input.website,
        email: input.email,
        phone: input.phone,
        contactName: input.contactName,
        address: input.address,
        addressLink: input.addressLink,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        street: input.street,
        number: input.number,
        complement: input.complement,
        neighborhood: input.neighborhood,
        cityId: input.cityId ? BigInt(input.cityId) : null,
        stateId: input.stateId ? BigInt(input.stateId) : null,
        latitude: input.latitude,
        longitude: input.longitude,
        isJudicial: input.isJudicial ?? false,
        judicialBranchId: input.judicialBranchId ? BigInt(input.judicialBranchId) : null,
        userId: input.userId ? BigInt(input.userId) : null,
        tenantId: ctx.tenantIdBigInt,
        updatedAt: new Date(),
      },
    });
    return sanitizeResponse(record);
  },
});

/* ---------- UPDATE ---------- */
export const updateSeller = createAdminAction({
  inputSchema: sellerSchema.extend({ id: z.string() }),
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const { id, ...rest } = input;
    const record = await prisma.seller.update({
      where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt },
      data: {
        publicId: rest.publicId,
        name: rest.name,
        slug: rest.slug,
        description: rest.description,
        logoUrl: rest.logoUrl,
        logoMediaId: rest.logoMediaId ? BigInt(rest.logoMediaId) : null,
        dataAiHintLogo: rest.dataAiHintLogo,
        website: rest.website,
        email: rest.email,
        phone: rest.phone,
        contactName: rest.contactName,
        address: rest.address,
        addressLink: rest.addressLink,
        city: rest.city,
        state: rest.state,
        zipCode: rest.zipCode,
        street: rest.street,
        number: rest.number,
        complement: rest.complement,
        neighborhood: rest.neighborhood,
        cityId: rest.cityId ? BigInt(rest.cityId) : null,
        stateId: rest.stateId ? BigInt(rest.stateId) : null,
        latitude: rest.latitude,
        longitude: rest.longitude,
        isJudicial: rest.isJudicial ?? false,
        judicialBranchId: rest.judicialBranchId ? BigInt(rest.judicialBranchId) : null,
        userId: rest.userId ? BigInt(rest.userId) : null,
      },
    });
    return sanitizeResponse(record);
  },
});

/* ---------- DELETE ---------- */
export const deleteSeller = createAdminAction({
  inputSchema: z.object({ id: z.string() }),
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    await prisma.seller.delete({
      where: { id: BigInt(input.id), tenantId: ctx.tenantIdBigInt },
    });
    return { deleted: true };
  },
});
