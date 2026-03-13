/**
 * @fileoverview Server Actions para MapSettings (Configurações de Mapa) no Admin Plus.
 * Singleton por tenant — carrega/salva via upsert com platformSettingsId.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { getPlatformSettingsId } from '@/lib/admin-plus/get-platform-settings-id';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { mapSettingsSchema } from './schema';

/* ─── Get (singleton) ─── */
export const getMapSettingsAction = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ ctx }) => {
    const psId = await getPlatformSettingsId(ctx.tenantId);
    const settings = await prisma.mapSettings.findUnique({ where: { platformSettingsId: psId } });
    return sanitizeResponse(settings);
  },
});

/* ─── Upsert ─── */
export const updateMapSettingsAction = createAdminAction({
  inputSchema: mapSettingsSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const psId = await getPlatformSettingsId(ctx.tenantId);
    const result = await prisma.mapSettings.upsert({
      where: { platformSettingsId: psId },
      create: { ...input, platformSettingsId: psId },
      update: input,
    });
    return sanitizeResponse(result);
  },
});
