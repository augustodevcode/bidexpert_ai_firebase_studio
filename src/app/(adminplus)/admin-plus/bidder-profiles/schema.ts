/**
 * @fileoverview Zod schema para BidderProfile (Perfil do Arrematante) — Admin Plus.
 */
import { z } from 'zod';

export const bidderProfileSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'Usuário é obrigatório'),
  fullName: z.string().nullable().optional(),
  cpf: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  documentStatus: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED']).optional().default('PENDING'),
  emailNotifications: z.boolean().optional().default(true),
  smsNotifications: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export type BidderProfileFormValues = z.infer<typeof bidderProfileSchema>;
