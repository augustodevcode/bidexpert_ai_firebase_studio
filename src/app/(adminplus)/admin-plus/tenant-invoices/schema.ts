/**
 * Schema Zod e opções de enum para TenantInvoice no Admin Plus.
 */
import { z } from 'zod';

export const TENANT_INVOICE_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'PAID', label: 'Pago' },
  { value: 'OVERDUE', label: 'Vencido' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'REFUNDED', label: 'Reembolsado' },
] as const;

export const tenantInvoiceSchema = z.object({
  tenantId: z.string().min(1, 'Tenant é obrigatório'),
  invoiceNumber: z.string().min(1, 'Número da fatura é obrigatório'),
  externalId: z.string().optional().or(z.literal('')),
  amount: z.string().min(1, 'Valor é obrigatório'),
  currency: z.string().min(1, 'Moeda é obrigatória'),
  periodStart: z.string().min(1, 'Início do período é obrigatório'),
  periodEnd: z.string().min(1, 'Fim do período é obrigatório'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  paidAt: z.string().optional().or(z.literal('')),
  status: z.string().min(1, 'Status é obrigatório'),
  description: z.string().optional().or(z.literal('')),
  lineItems: z.string().optional().or(z.literal('')),
  paymentMethod: z.string().optional().or(z.literal('')),
  paymentReference: z.string().optional().or(z.literal('')),
  invoiceUrl: z.string().optional().or(z.literal('')),
  receiptUrl: z.string().optional().or(z.literal('')),
  metadata: z.string().optional().or(z.literal('')),
});

export type TenantInvoiceFormData = z.infer<typeof tenantInvoiceSchema>;
