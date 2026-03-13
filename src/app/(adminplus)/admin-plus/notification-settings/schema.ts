/**
 * @fileoverview Schema Zod para NotificationSettings (Configurações de Notificação).
 */

import { z } from 'zod';

export const notificationSettingsSchema = z.object({
  notifyOnNewAuction: z.boolean().optional().default(true),
  notifyOnFeaturedLot: z.boolean().optional().default(true),
  notifyOnAuctionEndingSoon: z.boolean().optional().default(true),
  notifyOnPromotions: z.boolean().optional().default(false),
});

export type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;
