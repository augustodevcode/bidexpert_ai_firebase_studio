/**
 * @fileoverview Server Actions para PaymentGatewaySettings no Admin Plus.
 * Singleton por tenant — carrega/salva via upsert com platformSettingsId.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { getPlatformSettingsId } from '@/lib/admin-plus/get-platform-settings-id';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { paymentGatewaySettingsSchema } from './schema';

export const getPaymentGatewaySettingsAction = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ ctx }) => {
    const psId = await getPlatformSettingsId(ctx.tenantId);
    const settings = await prisma.paymentGatewaySettings.findUnique({ where: { platformSettingsId: psId } });
    return sanitizeResponse(settings);
  },
});

export const updatePaymentGatewaySettingsAction = createAdminAction({
  inputSchema: paymentGatewaySettingsSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const psId = await getPlatformSettingsId(ctx.tenantId);
    const result = await prisma.paymentGatewaySettings.upsert({
      where: { platformSettingsId: psId },
      create: { ...input, platformSettingsId: psId },
      update: input,
    });
    return sanitizeResponse(result);
  },
});
