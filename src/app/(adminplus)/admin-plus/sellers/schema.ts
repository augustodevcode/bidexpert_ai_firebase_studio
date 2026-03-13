/**
 * @fileoverview Schema Zod para Seller — Admin Plus.
 */
import { z } from 'zod';

export const sellerSchema = z.object({
  publicId: z.string().min(1, 'ID público é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório'),
  description: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  logoMediaId: z.string().optional().nullable(),
  dataAiHintLogo: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  addressLink: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  stateId: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  isJudicial: z.boolean().optional().default(false),
  judicialBranchId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
});

export type SellerInput = z.infer<typeof sellerSchema>;
