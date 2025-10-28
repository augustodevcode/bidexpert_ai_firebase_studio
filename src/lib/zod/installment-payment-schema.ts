// src/lib/zod/installment-payment-schema.ts
/**
 * @fileoverview Esquemas de validação Zod para a entidade InstallmentPayment.
 */

import { z } from 'zod';
import { paymentStatusValues } from '@/lib/zod-enums';

export const InstallmentPaymentSchema = z.object({
  id: z.string().cuid().optional(),
  userWinId: z.string().cuid(),
  installmentNumber: z.number().int().positive(),
  amount: z.number().positive(),
  dueDate: z.date(),
  status: z.enum(paymentStatusValues as [string, ...string[]]).default('PENDENTE'),
  paymentDate: z.date().optional().nullable(),
  transactionId: z.string().optional().nullable(),
});

export const CreateInstallmentPaymentSchema = InstallmentPaymentSchema.omit({ id: true });

export type InstallmentPaymentFormData = z.infer<typeof InstallmentPaymentSchema>;
export type CreateInstallmentPaymentInput = z.infer<typeof CreateInstallmentPaymentSchema>;
