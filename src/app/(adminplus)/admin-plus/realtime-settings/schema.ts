/**
 * @fileoverview Schema Zod para RealtimeSettings (Configurações Realtime / Feature Flags).
 * 22 campos organizados em 5 seções: Blockchain, Soft Close, Portal do Advogado,
 * Estratégias (Comunicação/Vídeo/Idempotência), Feature Flags.
 */

import { z } from 'zod';

export const realtimeSettingsSchema = z.object({
  // Blockchain
  blockchainEnabled: z.boolean().optional().default(false),
  blockchainNetwork: z.string().optional().default('NONE'),

  // Soft Close
  softCloseEnabled: z.boolean().optional().default(false),
  softCloseMinutes: z.coerce.number().int().min(1).optional().default(5),

  // Portal do Advogado
  lawyerPortalEnabled: z.boolean().optional().default(true),
  lawyerMonetizationModel: z.string().optional().default('SUBSCRIPTION'),
  lawyerSubscriptionPrice: z.coerce.number().int().nullable().optional(),
  lawyerPerUsePrice: z.coerce.number().int().nullable().optional(),
  lawyerRevenueSharePercent: z.coerce.number().min(0).max(100).nullable().optional(),

  // Estratégias V2
  communicationStrategy: z.enum(['WEBSOCKET', 'POLLING']).optional().default('WEBSOCKET'),
  videoStrategy: z.enum(['HLS', 'WEBRTC', 'DISABLED']).optional().default('DISABLED'),
  idempotencyStrategy: z.enum(['SERVER_HASH', 'CLIENT_UUID']).optional().default('SERVER_HASH'),

  // Feature Flags
  fipeIntegrationEnabled: z.boolean().optional().default(false),
  cartorioIntegrationEnabled: z.boolean().optional().default(false),
  tribunalIntegrationEnabled: z.boolean().optional().default(false),
  pwaEnabled: z.boolean().optional().default(true),
  offlineFirstEnabled: z.boolean().optional().default(false),
  maintenanceMode: z.boolean().optional().default(false),
  debugLogsEnabled: z.boolean().optional().default(false),
});

export type RealtimeSettingsFormValues = z.infer<typeof realtimeSettingsSchema>;
