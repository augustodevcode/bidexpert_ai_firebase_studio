/**
 * @fileoverview Server Actions para IdMasks no Admin Plus.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { getPlatformSettingsId } from '@/lib/admin-plus/get-platform-settings-id';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { idMasksSchema } from './schema';

export const getIdMasksAction = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ ctx }) => {
    const psId = await getPlatformSettingsId(ctx.tenantId);
    const settings = await prisma.idMasks.findUnique({ where: { platformSettingsId: psId } });
    return sanitizeResponse(settings);
  },
});

export const updateIdMasksAction = createAdminAction({
  inputSchema: idMasksSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const psId = await getPlatformSettingsId(ctx.tenantId);
    const result = await prisma.idMasks.upsert({
      where: { platformSettingsId: psId },
      create: { ...input, platformSettingsId: psId },
      update: input,
    });
    return sanitizeResponse(result);
  },
});
