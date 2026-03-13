/**
 * @fileoverview Server Actions para SectionBadgeVisibility no Admin Plus.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { getPlatformSettingsId } from '@/lib/admin-plus/get-platform-settings-id';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { sectionBadgeVisibilitySchema } from './schema';

export const getSectionBadgeVisibilityAction = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ ctx }) => {
    const psId = await getPlatformSettingsId(ctx.tenantId);
    const settings = await prisma.sectionBadgeVisibility.findUnique({ where: { platformSettingsId: psId } });
    return sanitizeResponse(settings);
  },
});

export const updateSectionBadgeVisibilityAction = createAdminAction({
  inputSchema: sectionBadgeVisibilitySchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const psId = await getPlatformSettingsId(ctx.tenantId);
    const result = await prisma.sectionBadgeVisibility.upsert({
      where: { platformSettingsId: psId },
      create: { ...input, platformSettingsId: psId },
      update: input,
    });
    return sanitizeResponse(result);
  },
});
