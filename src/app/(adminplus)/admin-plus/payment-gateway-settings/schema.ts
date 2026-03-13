/**
 * @fileoverview Schema Zod para PaymentGatewaySettings (Configurações de Gateway de Pagamento).
 */

import { z } from 'zod';

export const paymentGatewaySettingsSchema = z.object({
  defaultGateway: z.string().nullable().optional(),
  platformCommissionPercentage: z.coerce.number().min(0).max(100).nullable().optional(),
  gatewayApiKey: z.string().nullable().optional(),
  gatewayEncryptionKey: z.string().nullable().optional(),
});

export type PaymentGatewaySettingsFormValues = z.infer<typeof paymentGatewaySettingsSchema>;
