/**
 * @fileoverview Zod schema para Auctioneer (Leiloeiro) — Admin Plus.
 */
import { z } from 'zod';

export const auctioneerSchema = z.object({
  id: z.string().optional(),
  publicId: z.string().min(1, 'ID público é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório'),
  description: z.string().nullable().optional(),
  registrationNumber: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  logoMediaId: z.string().nullable().optional(),
  dataAiHintLogo: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  email: z.string().email('Email inválido').nullable().optional(),
  phone: z.string().nullable().optional(),
  supportWhatsApp: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  addressLink: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  cityId: z.string().nullable().optional(),
  stateId: z.string().nullable().optional(),
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
  userId: z.string().nullable().optional(),
});

export type AuctioneerFormValues = z.infer<typeof auctioneerSchema>;
