/**
 * @fileoverview Server Actions CRUD para UsersOnRoles (junction User ↔ Role) — Admin Plus.
 * Usa chave composta [userId, roleId] como PK.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { usersOnRolesSchema } from './schema';
import { z } from 'zod';
import type { UsersOnRolesRow } from './types';

/* ---------- LIST ---------- */
export const listUsersOnRoles = createAdminAction({
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
            { User: { name: { contains: search } } },
            { User: { email: { contains: search } } },
            { Role: { name: { contains: search } } },
          ],
        }
      : {};

    const orderBy = sortField
      ? { [sortField]: sortOrder ?? 'asc' }
      : { assignedAt: 'desc' as const };

    const [raw, total] = await Promise.all([
      prisma.usersOnRoles.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          User: { select: { id: true, name: true, email: true } },
          Role: { select: { id: true, name: true } },
        },
      }),
      prisma.usersOnRoles.count({ where }),
    ]);

    const data: UsersOnRolesRow[] = raw.map((r) => ({
      compositeId: `${r.userId}:${r.roleId}`,
      userId: r.userId.toString(),
      roleId: r.roleId.toString(),
      assignedAt: r.assignedAt.toISOString(),
      assignedBy: r.assignedBy ?? '',
      userName: r.User?.name ?? undefined,
      userEmail: r.User?.email ?? undefined,
      roleName: r.Role?.name ?? undefined,
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
export const createUsersOnRoles = createAdminAction({
  inputSchema: usersOnRolesSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const record = await prisma.usersOnRoles.create({
      data: {
        userId: BigInt(input.userId),
        roleId: BigInt(input.roleId),
        assignedBy: input.assignedBy || ctx.userId,
        assignedAt: new Date(),
      },
    });
    return sanitizeResponse(record);
  },
});

/* ---------- DELETE ---------- */
export const deleteUsersOnRoles = createAdminAction({
  inputSchema: z.object({ userId: z.string(), roleId: z.string() }),
  requiredPermission: 'manage_all',
  handler: async ({ input }) => {
    await prisma.usersOnRoles.delete({
      where: {
        userId_roleId: {
          userId: BigInt(input.userId),
          roleId: BigInt(input.roleId),
        },
      },
    });
    return { deleted: true };
  },
});
