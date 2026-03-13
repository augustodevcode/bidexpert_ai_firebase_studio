/**
 * @fileoverview Server Actions — CRUD de BidderProfile (Perfil do Arrematante) — Admin Plus.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { bidderProfileSchema } from './schema';
import { z } from 'zod';

/* ── List ─────────────────────────────────────── */
export const listBidderProfiles = createAdminAction({
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
        { fullName: { contains: search } },
        { cpf: { contains: search } },
        { User: { name: { contains: search } } },
        { User: { email: { contains: search } } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.bidderProfile.findMany({
        where,
        include: { User: { select: { name: true, email: true } } },
        orderBy: { [sortField]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.bidderProfile.count({ where }),
    ]);
    const rows = data.map((d) => ({
      ...d,
      userName: d.User?.name ?? '—',
      userEmail: d.User?.email ?? '—',
    }));
    return sanitizeResponse({
      data: rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  },
});

/* ── Create ───────────────────────────────────── */
export const createBidderProfile = createAdminAction({
  inputSchema: bidderProfileSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const record = await prisma.bidderProfile.create({
      data: {
        userId: BigInt(input.userId),
        fullName: input.fullName ?? null,
        cpf: input.cpf ?? null,
        phone: input.phone ?? null,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        zipCode: input.zipCode ?? null,
        documentStatus: input.documentStatus ?? 'PENDING',
        emailNotifications: input.emailNotifications ?? true,
        smsNotifications: input.smsNotifications ?? false,
        isActive: input.isActive ?? true,
        tenantId: ctx.tenantIdBigInt,
        updatedAt: new Date(),
      },
    });
    return sanitizeResponse(record);
  },
});

/* ── Update ───────────────────────────────────── */
export const updateBidderProfile = createAdminAction({
  inputSchema: bidderProfileSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    if (!input.id) throw new Error('ID obrigatório');
    const record = await prisma.bidderProfile.update({
      where: { id: BigInt(input.id), tenantId: ctx.tenantIdBigInt },
      data: {
        userId: BigInt(input.userId),
        fullName: input.fullName ?? null,
        cpf: input.cpf ?? null,
        phone: input.phone ?? null,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        zipCode: input.zipCode ?? null,
        documentStatus: input.documentStatus ?? 'PENDING',
        emailNotifications: input.emailNotifications ?? true,
        smsNotifications: input.smsNotifications ?? false,
        isActive: input.isActive ?? true,
      },
    });
    return sanitizeResponse(record);
  },
});

/* ── Delete ───────────────────────────────────── */
export const deleteBidderProfile = createAdminAction({
  inputSchema: z.object({ id: z.string() }),
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    await prisma.bidderProfile.delete({
      where: { id: BigInt(input.id), tenantId: ctx.tenantIdBigInt },
    });
    return { deleted: true };
  },
});
