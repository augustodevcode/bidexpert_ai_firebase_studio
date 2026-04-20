/**
 * @fileoverview Server actions para LotCategory — Admin Plus.
 * tenantId-scoped. Paginação client (poucos registros).
 */
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { lotCategorySchema } from './schema';
import type { LotCategoryRow } from './types';
import type { PaginatedResponse } from '@/lib/admin-plus/types';

/* ─── LIST ─── */
export const listLotCategories = createAdminAction({
  inputSchema: z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(200).default(50),
    search: z.string().optional(),
  }),
  requiredPermission: 'categories:read',
  handler: async ({ input, ctx }: { input: any; ctx: any }) => {
    const { page, pageSize, search } = input;
    const where: Record<string, unknown> = {
      OR: [
        { tenantId: ctx.tenantIdBigInt },
        { tenantId: null, isGlobal: true },
      ],
    };
    if (search) {
      where.AND = [{
        OR: [
          { name: { contains: search } },
          { slug: { contains: search } },
        ],
      }];
    }
    const [data, total] = await Promise.all([
      prisma.lotCategory.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lotCategory.count({ where }),
    ]);
    const rows = sanitizeResponse(data) as unknown as LotCategoryRow[];
    return { data: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },
});

/* ─── CREATE ─── */
export const createLotCategory = createAdminAction<typeof lotCategorySchema, LotCategoryRow>({
  inputSchema: lotCategorySchema,
  requiredPermission: 'categories:create',
  handler: async ({ input, ctx }) => {
    const record = await prisma.lotCategory.create({
      data: { ...input, tenantId: ctx.tenantIdBigInt, updatedAt: new Date() },
    });
    return sanitizeResponse(record) as unknown as LotCategoryRow;
  },
});

/* ─── UPDATE ─── */
export const updateLotCategory = createAdminAction<
  z.ZodObject<{ id: z.ZodString; data: typeof lotCategorySchema }>,
  LotCategoryRow
>({
  inputSchema: z.object({ id: z.string().min(1), data: lotCategorySchema }),
  requiredPermission: 'categories:update',
  handler: async ({ input, ctx }) => {
    const record = await prisma.lotCategory.update({
      where: { id: BigInt(input.id), tenantId: ctx.tenantIdBigInt },
      data: { ...input.data, updatedAt: new Date() },
    });
    return sanitizeResponse(record) as unknown as LotCategoryRow;
  },
});

/* ─── DELETE ─── */
export const deleteLotCategory = createAdminAction<z.ZodObject<{ id: z.ZodString }>, boolean>({
  inputSchema: z.object({ id: z.string().min(1) }),
  requiredPermission: 'categories:delete',
  handler: async ({ input, ctx }) => {
    await prisma.lotCategory.delete({
      where: { id: BigInt(input.id), tenantId: ctx.tenantIdBigInt },
    });
    return true;
  },
});
