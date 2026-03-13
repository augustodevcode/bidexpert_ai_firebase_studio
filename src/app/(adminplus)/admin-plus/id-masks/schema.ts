/**
 * @fileoverview Schema Zod para IdMasks (máscaras de identificadores de entidades).
 * 8 campos de máscara como string nullable.
 */

import { z } from 'zod';

export const idMasksSchema = z.object({
  auctionIdMask: z.string().nullable().optional().default(null),
  lotIdMask: z.string().nullable().optional().default(null),
  bidIdMask: z.string().nullable().optional().default(null),
  invoiceIdMask: z.string().nullable().optional().default(null),
  userIdMask: z.string().nullable().optional().default(null),
  processIdMask: z.string().nullable().optional().default(null),
  contractIdMask: z.string().nullable().optional().default(null),
  receiptIdMask: z.string().nullable().optional().default(null),
});

export type IdMasksFormValues = z.infer<typeof idMasksSchema>;
