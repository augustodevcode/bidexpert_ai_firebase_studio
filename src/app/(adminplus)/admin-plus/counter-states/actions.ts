/**
 * @fileoverview Server actions de CRUD para CounterState — Admin Plus.
 * CounterState é scoped por tenantId com @@unique([tenantId, entityType]).
 */
'use server';

import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { z } from 'zod';
import { counterStateSchema } from './schema';

/* ── LIST ── */
export const listCounterStatesAction = createAdminAction({
  inputSchema: z.object({
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(25),
    search: z.string().optional().default(''),
    sortField: z.string().optional().default('entityType'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const where: Record<string, unknown> = { tenantId: ctx.tenantIdBigInt };
    if (input.search) {
      where.entityType = { contains: input.search };
    }
    const [data, total] = await Promise.all([
      prisma.counterState.findMany({
        where,
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        orderBy: { [input.sortField]: input.sortOrder },
      }),
      prisma.counterState.count({ where }),
    ]);
    return sanitizeResponse({
      data,
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.ceil(total / input.pageSize),
    });
  },
});

/* ── CREATE ── */
export const createCounterStateAction = createAdminAction({
  inputSchema: counterStateSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const record = await prisma.counterState.create({
      data: {
        tenantId: ctx.tenantIdBigInt,
        entityType: input.entityType,
        currentValue: input.currentValue ?? 0,
        updatedAt: new Date(),
      },
    });
    return sanitizeResponse(record);
  },
});

/* ── UPDATE ── */
export const updateCounterStateAction = createAdminAction({
  inputSchema: counterStateSchema.extend({ id: z.string() }),
  requiredPermission: 'manage_all',
  handler: async ({ input }) => {
    const { id, ...rest } = input;
    const record = await prisma.counterState.update({
      where: { id: BigInt(id) },
      data: { ...rest, updatedAt: new Date() },
    });
    return sanitizeResponse(record);
  },
});

/* ── DELETE ── */
export const deleteCounterStateAction = createAdminAction({
  inputSchema: z.object({ id: z.string() }),
  requiredPermission: 'manage_all',
  handler: async ({ input }) => {
    await prisma.counterState.delete({ where: { id: BigInt(input.id) } });
    return { deleted: true };
  },
});
