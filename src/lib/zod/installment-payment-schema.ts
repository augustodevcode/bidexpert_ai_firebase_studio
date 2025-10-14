/**
 * @fileoverview Esquemas de validação Zod para a entidade InstallmentPayment.
 */

import { z } from 'zod';
import { PaymentStatus } from '@prisma/client';

export const InstallmentPaymentSchema = z.object({
  id: z.string().cuid().optional(),
  userWinId: z.string().cuid(),
  lotId: z.string().cuid(),
  installmentNumber: z.number().int().positive(),
  totalInstallments: z.number().int().positive(),
  amount: z.number().positive(),
  dueDate: z.date(),
  paymentDate: z.date().optional().nullable(),
  status: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDENTE),
});

export const CreateInstallmentPaymentSchema = InstallmentPaymentSchema.omit({ id: true });

export type InstallmentPaymentFormData = z.infer<typeof InstallmentPaymentSchema>;
export type CreateInstallmentPaymentInput = z.infer<typeof CreateInstallmentPaymentSchema>;
