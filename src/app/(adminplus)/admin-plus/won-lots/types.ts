/**
 * Definição de tipo WonLotRow para o Admin Plus.
 */
export interface WonLotRow {
  id: string;
  bidderId: string;
  bidderName: string;
  lotId: string;
  auctionId: string;
  title: string;
  finalBid: string;
  totalAmount: string;
  paidAmount: string;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  wonAt: string;
  dueDate: string;
  trackingCode: string;
  invoiceUrl: string;
  receiptUrl: string;
  createdAt: string;
  updatedAt: string;
}
