/**
 * @fileoverview Schema Zod para MentalTriggerSettings (Gatilhos Mentais).
 */

import { z } from 'zod';

export const mentalTriggerSettingsSchema = z.object({
  showDiscountBadge: z.boolean().optional().default(true),
  showPopularityBadge: z.boolean().optional().default(true),
  popularityViewThreshold: z.coerce.number().int().min(1).optional().default(500),
  showHotBidBadge: z.boolean().optional().default(true),
  hotBidThreshold: z.coerce.number().int().min(1).optional().default(10),
  showExclusiveBadge: z.boolean().optional().default(true),
});

export type MentalTriggerSettingsFormValues = z.infer<typeof mentalTriggerSettingsSchema>;
