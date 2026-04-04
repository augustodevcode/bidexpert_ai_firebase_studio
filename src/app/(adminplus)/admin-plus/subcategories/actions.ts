/**
 * @fileoverview Server actions para Subcategory — Admin Plus.
 * tenantId-scoped. Inclui join com LotCategory para parentCategoryName.
 */
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { subcategorySchema } from './schema';
import type { SubcategoryRow } from './types';
import type { PaginatedResponse } from '@/lib/admin-plus/types';

const includeCategory = { LotCategory: { select: { name: true } } } as const;

function toRow(record: Record<string, unknown>): SubcategoryRow {
  const sanitized = sanitizeResponse(record) as Record<string, unknown>;
  const cat = (record as Record<string, unknown>).LotCategory as { name: string } | null;
  return {
    ...sanitized,
    parentCategoryName: cat?.name ?? '',
  } as unknown as SubcategoryRow;
}

/* ─── LIST ─── */
export const listSubcategories = createAdminAction({
  inputSchema: z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(200).default(50),
    search: z.string().optional(),
  }),
  requiredPermission: 'subcategories:read',
  handler: async ({ input, ctx }: { input: any; ctx: any }) => {
    const { page, pageSize, search } = input;
    const where: Record<string, unknown> = { tenantId: ctx.tenantIdBigInt };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.subcategory.findMany({
        where,
        include: includeCategory,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.subcategory.count({ where }),
    ]);
    const rows = data.map(toRow);
    return { data: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },
});

/* ─── CREATE ─── */
export const createSubcategory = createAdminAction<typeof subcategorySchema, SubcategoryRow>({
  inputSchema: subcategorySchema,
  requiredPermission: 'subcategories:create',
  handler: async ({ input, ctx }) => {
    const { parentCategoryId, ...rest } = input;
    const record = await prisma.subcategory.create({
      data: {
        ...rest,
        parentCategoryId: BigInt(parentCategoryId),
        tenantId: ctx.tenantIdBigInt,
      },
      include: includeCategory,
    });
    return toRow(record as unknown as Record<string, unknown>);
  },
});

/* ─── UPDATE ─── */
export const updateSubcategory = createAdminAction<
  z.ZodObject<{ id: z.ZodString; data: typeof subcategorySchema }>,
  SubcategoryRow
>({
  inputSchema: z.object({ id: z.string().min(1), data: subcategorySchema }),
  requiredPermission: 'subcategories:update',
  handler: async ({ input, ctx }) => {
    const { parentCategoryId, ...rest } = input.data;
    const record = await prisma.subcategory.update({
      where: { id: BigInt(input.id), tenantId: ctx.tenantIdBigInt },
      data: {
        ...rest,
        parentCategoryId: BigInt(parentCategoryId),
      },
      include: includeCategory,
    });
    return toRow(record as unknown as Record<string, unknown>);
  },
});

/* ─── DELETE ─── */
export const deleteSubcategory = createAdminAction<z.ZodObject<{ id: z.ZodString }>, boolean>({
  inputSchema: z.object({ id: z.string().min(1) }),
  requiredPermission: 'subcategories:delete',
  handler: async ({ input, ctx }) => {
    await prisma.subcategory.delete({
      where: { id: BigInt(input.id), tenantId: ctx.tenantIdBigInt },
    });
    return true;
  },
});
