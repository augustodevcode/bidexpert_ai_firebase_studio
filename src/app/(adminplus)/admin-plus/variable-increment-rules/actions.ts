/**
 * @fileoverview Server Actions CRUD para VariableIncrementRule — Admin Plus.
 * Regras de incremento variável, scopadas por platformSettingsId.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { getPlatformSettingsId } from '@/lib/admin-plus/get-platform-settings-id';
import { variableIncrementRuleSchema } from './schema';
import { z } from 'zod';

/* ---------- LIST ---------- */
export const listVariableIncrementRules = createAdminAction({
  inputSchema: z.object({
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(25),
    sortField: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const platformSettingsId = await getPlatformSettingsId(ctx.tenantId);
    const { page, pageSize, sortField, sortOrder } = input;
    const skip = (page - 1) * pageSize;

    const orderBy = sortField
      ? { [sortField]: sortOrder ?? 'asc' }
      : { from: 'asc' as const };

    const [data, total] = await Promise.all([
      prisma.variableIncrementRule.findMany({
        where: { platformSettingsId },
        skip,
        take: pageSize,
        orderBy,
      }),
      prisma.variableIncrementRule.count({ where: { platformSettingsId } }),
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

/* ---------- CREATE ---------- */
export const createVariableIncrementRule = createAdminAction({
  inputSchema: variableIncrementRuleSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const platformSettingsId = await getPlatformSettingsId(ctx.tenantId);
    const record = await prisma.variableIncrementRule.create({
      data: {
        ...input,
        platformSettingsId,
      },
    });
    return sanitizeResponse(record);
  },
});

/* ---------- UPDATE ---------- */
export const updateVariableIncrementRule = createAdminAction({
  inputSchema: variableIncrementRuleSchema.extend({ id: z.string() }),
  requiredPermission: 'manage_all',
  handler: async ({ input }) => {
    const { id, ...data } = input;
    const record = await prisma.variableIncrementRule.update({
      where: { id: BigInt(id) },
      data,
    });
    return sanitizeResponse(record);
  },
});

/* ---------- DELETE ---------- */
export const deleteVariableIncrementRule = createAdminAction({
  inputSchema: z.object({ id: z.string() }),
  requiredPermission: 'manage_all',
  handler: async ({ input }) => {
    await prisma.variableIncrementRule.delete({ where: { id: BigInt(input.id) } });
    return { deleted: true };
  },
});
