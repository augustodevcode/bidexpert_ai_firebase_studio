/**
 * @fileoverview Schema Zod para BiddingSettings (Configurações de Lances).
 * Define validações para criação/atualização das configurações de lances do tenant.
 */

import { z } from 'zod';

export const biddingSettingsSchema = z.object({
  instantBiddingEnabled: z.boolean().default(false),
  getBidInfoInstantly: z.boolean().default(false),
  biddingInfoCheckIntervalSeconds: z.coerce.number().int().min(1).nullable().optional(),
  defaultStageDurationDays: z.coerce.number().int().min(1).nullable().optional(),
  defaultDaysBetweenStages: z.coerce.number().int().min(0).nullable().optional(),
  proxyBiddingEnabled: z.boolean().default(true),
  softCloseTriggerMinutes: z.coerce.number().int().min(1).default(3),
});

export type BiddingSettingsFormValues = z.infer<typeof biddingSettingsSchema>;
