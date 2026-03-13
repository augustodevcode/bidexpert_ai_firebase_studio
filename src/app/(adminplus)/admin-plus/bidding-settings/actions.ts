/**
 * @fileoverview Server Actions para BiddingSettings (Configurações de Lances) no Admin Plus.
 * Singleton por tenant — carrega/salva via upsert com platformSettingsId.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { getPlatformSettingsId } from '@/lib/admin-plus/get-platform-settings-id';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { biddingSettingsSchema } from './schema';

/* ─── Get (singleton) ─── */
export const getBiddingSettingsAction = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ ctx }) => {
    const psId = await getPlatformSettingsId(ctx.tenantId);
    const settings = await prisma.biddingSettings.findUnique({ where: { platformSettingsId: psId } });
    return sanitizeResponse(settings);
  },
});

/* ─── Upsert ─── */
export const updateBiddingSettingsAction = createAdminAction({
  inputSchema: biddingSettingsSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const psId = await getPlatformSettingsId(ctx.tenantId);
    const result = await prisma.biddingSettings.upsert({
      where: { platformSettingsId: psId },
      create: { ...input, platformSettingsId: psId },
      update: input,
    });
    return sanitizeResponse(result);
  },
});
