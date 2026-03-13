/**
 * Schema Zod para validação de UserWin (Arrematações).
 */
import { z } from 'zod';

export const userWinSchema = z.object({
  lotId: z.string().min(1, 'Lote é obrigatório'),
  userId: z.string().min(1, 'Usuário é obrigatório'),
  winningBidAmount: z.string().min(1, 'Valor do lance vencedor é obrigatório'),
  winDate: z.string().min(1, 'Data da arrematação é obrigatória'),
  paymentStatus: z.string().min(1, 'Status de pagamento é obrigatório'),
  retrievalStatus: z.string().min(1, 'Status de retirada é obrigatório'),
  invoiceUrl: z.string().or(z.literal('')).optional(),
});

export type UserWinFormValues = z.infer<typeof userWinSchema>;

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'PROCESSANDO', label: 'Processando' },
  { value: 'PAGO', label: 'Pago' },
  { value: 'FALHOU', label: 'Falhou' },
  { value: 'REEMBOLSADO', label: 'Reembolsado' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'ATRASADO', label: 'Atrasado' },
] as const;

export const RETRIEVAL_STATUS_OPTIONS = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_TRANSPORTE', label: 'Em Transporte' },
  { value: 'ENTREGUE', label: 'Entregue' },
  { value: 'CANCELADO', label: 'Cancelado' },
] as const;
