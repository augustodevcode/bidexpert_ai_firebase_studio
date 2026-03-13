/**
 * @fileoverview Server Actions para NotificationSettings no Admin Plus.
 * Singleton por tenant — carrega/salva via upsert com platformSettingsId.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { getPlatformSettingsId } from '@/lib/admin-plus/get-platform-settings-id';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { notificationSettingsSchema } from './schema';

export const getNotificationSettingsAction = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ ctx }) => {
    const psId = await getPlatformSettingsId(ctx.tenantId);
    const settings = await prisma.notificationSettings.findUnique({ where: { platformSettingsId: psId } });
    return sanitizeResponse(settings);
  },
});

export const updateNotificationSettingsAction = createAdminAction({
  inputSchema: notificationSettingsSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const psId = await getPlatformSettingsId(ctx.tenantId);
    const result = await prisma.notificationSettings.upsert({
      where: { platformSettingsId: psId },
      create: { ...input, platformSettingsId: psId },
      update: input,
    });
    return sanitizeResponse(result);
  },
});
