/**
 * @fileoverview Schema Zod para IdMasks (máscaras de identificadores de entidades).
 * 8 campos de máscara como string nullable.
 */

import { z } from 'zod';

export const idMasksSchema = z.object({
  auctionCodeMask: z.string().nullable().optional().default(null),
  lotCodeMask: z.string().nullable().optional().default(null),
  sellerCodeMask: z.string().nullable().optional().default(null),
  auctioneerCodeMask: z.string().nullable().optional().default(null),
  userCodeMask: z.string().nullable().optional().default(null),
  assetCodeMask: z.string().nullable().optional().default(null),
  categoryCodeMask: z.string().nullable().optional().default(null),
  subcategoryCodeMask: z.string().nullable().optional().default(null),
});

export type IdMasksFormValues = z.infer<typeof idMasksSchema>;
