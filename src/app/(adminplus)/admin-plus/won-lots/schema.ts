/**
 * Schema Zod e opções de enum para WonLot (Lotes Arrematados) no Admin Plus.
 */
import { z } from 'zod';

export const WON_LOT_STATUS_OPTIONS = [
  { value: 'WON', label: 'Arrematado' },
  { value: 'PAID', label: 'Pago' },
  { value: 'DELIVERED', label: 'Entregue' },
  { value: 'CANCELLED', label: 'Cancelado' },
] as const;

export const WON_LOT_PAYMENT_STATUS_OPTIONS = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'PROCESSANDO', label: 'Processando' },
  { value: 'PAGO', label: 'Pago' },
  { value: 'FALHOU', label: 'Falhou' },
  { value: 'REEMBOLSADO', label: 'Reembolsado' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'ATRASADO', label: 'Atrasado' },
] as const;

export const WON_LOT_DELIVERY_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'PROCESSING', label: 'Processando' },
  { value: 'SHIPPED', label: 'Enviado' },
  { value: 'DELIVERED', label: 'Entregue' },
  { value: 'FAILED', label: 'Falhou' },
] as const;

export const wonLotSchema = z.object({
  bidderId: z.string().min(1, 'Arrematante obrigatório'),
  lotId: z.string().min(1, 'Lote obrigatório'),
  auctionId: z.string().min(1, 'Leilão obrigatório'),
  title: z.string().min(1, 'Título obrigatório'),
  finalBid: z.string().min(1, 'Lance final obrigatório'),
  totalAmount: z.string().min(1, 'Valor total obrigatório'),
  paidAmount: z.string().or(z.literal('')).optional(),
  status: z.string().min(1, 'Status obrigatório'),
  paymentStatus: z.string().min(1, 'Status de pagamento obrigatório'),
  deliveryStatus: z.string().min(1, 'Status de entrega obrigatório'),
  wonAt: z.string().or(z.literal('')).optional(),
  dueDate: z.string().or(z.literal('')).optional(),
  trackingCode: z.string().or(z.literal('')).optional(),
  invoiceUrl: z.string().or(z.literal('')).optional(),
  receiptUrl: z.string().or(z.literal('')).optional(),
});
