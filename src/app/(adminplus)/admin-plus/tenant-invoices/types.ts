/**
 * Tipos para as linhas da tabela de TenantInvoice no Admin Plus.
 */
export interface TenantInvoiceRow {
  id: string;
  tenantId: string;
  tenantName: string;
  invoiceNumber: string;
  externalId: string;
  amount: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  dueDate: string;
  paidAt: string;
  status: string;
  description: string;
  lineItems: string;
  paymentMethod: string;
  paymentReference: string;
  invoiceUrl: string;
  receiptUrl: string;
  metadata: string;
  createdAt: string;
  updatedAt: string;
}
