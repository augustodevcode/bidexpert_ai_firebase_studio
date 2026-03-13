/**
 * Tipos para InstallmentPayment (Parcelas de Pagamento).
 */
export interface InstallmentPaymentRow {
  id: string;
  userWinId: string;
  userWinLabel: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: string;
  paymentMethod: string | null;
  transactionId: string | null;
  createdAt: string;
}
