/**
 * @fileoverview Server Actions para PlatformSettings no Admin Plus.
 * Lê e atualiza a configuração central da plataforma (excluindo relações filhas).
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { getPlatformSettingsId } from '@/lib/admin-plus/get-platform-settings-id';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { platformSettingsSchema } from './schema';

export const getPlatformSettingsAction = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ ctx }) => {
    const psId = await getPlatformSettingsId(ctx.tenantId);
    const settings = await prisma.platformSettings.findUnique({
      where: { id: psId },
    });
    return sanitizeResponse(settings);
  },
});

export const updatePlatformSettingsAction = createAdminAction({
  inputSchema: platformSettingsSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const psId = await getPlatformSettingsId(ctx.tenantId);
    const result = await prisma.platformSettings.update({
      where: { id: psId },
      data: { ...input, updatedAt: new Date() },
    });
    return sanitizeResponse(result);
  },
});
