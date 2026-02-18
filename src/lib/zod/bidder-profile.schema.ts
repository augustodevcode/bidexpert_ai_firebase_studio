import { z } from 'zod';
import { BidderDocumentStatus } from '@/types/bidder-dashboard';

export const updateBidderProfileSchema = z.object({
  fullName: z.string().min(3, 'Nome muito curto').max(100, 'Nome muito longo').optional(),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido').optional(),
  phone: z.string().min(10, 'Telefone inválido').optional(),
  dateOfBirth: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  }, z.date()).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
  zipCode: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  documentStatus: z.nativeEnum(BidderDocumentStatus).optional(),
  isActive: z.boolean().optional(),
});
