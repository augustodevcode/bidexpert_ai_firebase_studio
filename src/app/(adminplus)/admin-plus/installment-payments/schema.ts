/**
 * Schema Zod para validação de InstallmentPayment (Parcelas de Pagamento).
 */
import { z } from 'zod';

export const installmentPaymentSchema = z.object({
  userWinId: z.string().min(1, 'Arrematação é obrigatória'),
  installmentNumber: z.string().min(1, 'Nº da parcela é obrigatório'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  paidAt: z.string().or(z.literal('')).optional(),
  status: z.string().min(1, 'Status é obrigatório'),
  paymentMethod: z.string().or(z.literal('')).optional(),
  transactionId: z.string().or(z.literal('')).optional(),
});

export type InstallmentPaymentFormValues = z.infer<typeof installmentPaymentSchema>;

export const INSTALLMENT_STATUS_OPTIONS = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'PROCESSANDO', label: 'Processando' },
  { value: 'PAGO', label: 'Pago' },
  { value: 'FALHOU', label: 'Falhou' },
  { value: 'REEMBOLSADO', label: 'Reembolsado' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'ATRASADO', label: 'Atrasado' },
] as const;
