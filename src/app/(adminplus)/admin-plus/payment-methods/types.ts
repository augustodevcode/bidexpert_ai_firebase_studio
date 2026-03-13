/**
 * Tipos da entidade PaymentMethod no Admin Plus.
 */
export interface PaymentMethodRow {
  id: string;
  bidderId: string;
  bidderName: string;
  type: string;
  isDefault: boolean;
  isActive: boolean;
  cardLast4: string;
  cardBrand: string;
  cardToken: string;
  pixKey: string;
  pixKeyType: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}
