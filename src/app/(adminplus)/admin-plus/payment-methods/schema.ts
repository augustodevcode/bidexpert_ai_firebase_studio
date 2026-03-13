/**
 * Schema de validação Zod para PaymentMethod no Admin Plus.
 */
import { z } from 'zod';

export const PAYMENT_METHOD_TYPE_OPTIONS = [
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de Débito' },
  { value: 'PIX', label: 'PIX' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'BANK_TRANSFER', label: 'Transferência Bancária' },
] as const;

export const paymentMethodSchema = z.object({
  bidderId: z.string().min(1, 'Arrematante obrigatório'),
  type: z.string().min(1, 'Tipo obrigatório'),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  cardLast4: z.string().optional().or(z.literal('')),
  cardBrand: z.string().optional().or(z.literal('')),
  cardToken: z.string().optional().or(z.literal('')),
  pixKey: z.string().optional().or(z.literal('')),
  pixKeyType: z.string().optional().or(z.literal('')),
  expiresAt: z.string().optional().or(z.literal('')),
});

export type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;
