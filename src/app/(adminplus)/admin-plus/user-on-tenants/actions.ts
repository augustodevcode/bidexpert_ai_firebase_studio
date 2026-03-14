/**
 * @fileoverview Server Actions CRUD para UserOnTenant (junction User ↔ Tenant) — Admin Plus.
 * Usa chave composta [userId, tenantId] como PK.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { userOnTenantSchema } from './schema';
import { z } from 'zod';
import type { UserOnTenantRow } from './types';

/* ---------- LIST ---------- */
export const listUserOnTenants = createAdminAction({
  inputSchema: z.object({
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(25),
    sortField: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
  }),
  requiredPermission: 'manage_all',
  handler: async ({ input }) => {
    const { page, pageSize, sortField, sortOrder, search } = input;
    const skip = (page - 1) * pageSize;

    const where = search
      ? {
          OR: [
            { User: { fullName: { contains: search } } },
            { User: { email: { contains: search } } },
            { Tenant: { name: { contains: search } } },
          ],
        }
      : {};

    const orderBy = sortField
      ? { [sortField]: sortOrder ?? 'asc' }
      : { assignedAt: 'desc' as const };

    const [raw, total] = await Promise.all([
      prisma.userOnTenant.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          User: { select: { id: true, fullName: true, email: true } },
          Tenant: { select: { id: true, name: true } },
        },
      }),
      prisma.userOnTenant.count({ where }),
    ]);

    const data: UserOnTenantRow[] = raw.map((r) => ({
      compositeId: `${r.userId}:${r.tenantId}`,
      userId: r.userId.toString(),
      tenantId: r.tenantId.toString(),
      assignedAt: r.assignedAt.toISOString(),
      assignedBy: r.assignedBy,
      userName: r.User?.fullName ?? undefined,
      userEmail: r.User?.email ?? undefined,
      tenantName: r.Tenant?.name ?? undefined,
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
export const createUserOnTenant = createAdminAction({
  inputSchema: userOnTenantSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const record = await prisma.userOnTenant.create({
      data: {
        userId: BigInt(input.userId),
        tenantId: BigInt(input.tenantId),
        assignedBy: input.assignedBy ?? ctx.userId,
        assignedAt: new Date(),
      },
    });
    return sanitizeResponse(record);
  },
});

/* ---------- DELETE ---------- */
export const deleteUserOnTenant = createAdminAction({
  inputSchema: z.object({ userId: z.string(), tenantId: z.string() }),
  requiredPermission: 'manage_all',
  handler: async ({ input }) => {
    await prisma.userOnTenant.delete({
      where: {
        userId_tenantId: {
          userId: BigInt(input.userId),
          tenantId: BigInt(input.tenantId),
        },
      },
    });
    return { deleted: true };
  },
});
