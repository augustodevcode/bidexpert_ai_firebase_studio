/**
 * @fileoverview Server actions de CRUD para ThemeSettings — Admin Plus.
 * ThemeSettings possui child ThemeColors (1:1) com light/dark JSON.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { z } from 'zod';
import { themeSettingsSchema } from './schema';
import { getPlatformSettingsId } from '@/lib/admin-plus/get-platform-settings-id';

/* ── LIST ── */
export const listThemeSettingsAction = createAdminAction({
  inputSchema: z.object({
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(25),
    search: z.string().optional().default(''),
    sortField: z.string().optional().default('name'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const platformSettingsId = await getPlatformSettingsId(ctx.tenantId);
    const where: Record<string, unknown> = { platformSettingsId };
    if (input.search) {
      where.name = { contains: input.search };
    }
    const [data, total] = await Promise.all([
      prisma.themeSettings.findMany({
        where,
        include: { ThemeColors: true },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        orderBy: { [input.sortField]: input.sortOrder },
      }),
      prisma.themeSettings.count({ where }),
    ]);
    const rows = data.map((t) => ({
      id: t.id.toString(),
      name: t.name,
      platformSettingsId: t.platformSettingsId?.toString() ?? null,
      light: t.ThemeColors?.light ?? null,
      dark: t.ThemeColors?.dark ?? null,
    }));
    return sanitizeResponse({
      data: rows,
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.ceil(total / input.pageSize),
    });
  },
});

/* ── CREATE ── */
export const createThemeSettingsAction = createAdminAction({
  inputSchema: themeSettingsSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const platformSettingsId = await getPlatformSettingsId(ctx.tenantId);
    const record = await prisma.themeSettings.create({
      data: {
        name: input.name,
        platformSettingsId,
        ThemeColors: {
          create: {
            light: input.light ?? undefined,
            dark: input.dark ?? undefined,
          },
        },
      },
      include: { ThemeColors: true },
    });
    return sanitizeResponse(record);
  },
});

/* ── UPDATE ── */
export const updateThemeSettingsAction = createAdminAction({
  inputSchema: themeSettingsSchema.extend({ id: z.string() }),
  requiredPermission: 'manage_all',
  handler: async ({ input }) => {
    const { id, light, dark, ...rest } = input;
    const bigId = BigInt(id);
    const record = await prisma.themeSettings.update({
      where: { id: bigId },
      data: {
        ...rest,
        platformSettingsId: rest.platformSettingsId ? BigInt(rest.platformSettingsId) : undefined,
        ThemeColors: {
          upsert: {
            create: { light: light ?? undefined, dark: dark ?? undefined },
            update: { light: light ?? undefined, dark: dark ?? undefined },
          },
        },
      },
      include: { ThemeColors: true },
    });
    return sanitizeResponse(record);
  },
});

/* ── DELETE ── */
export const deleteThemeSettingsAction = createAdminAction({
  inputSchema: z.object({ id: z.string() }),
  requiredPermission: 'manage_all',
  handler: async ({ input }) => {
    await prisma.themeSettings.delete({ where: { id: BigInt(input.id) } });
    return { deleted: true };
  },
});
