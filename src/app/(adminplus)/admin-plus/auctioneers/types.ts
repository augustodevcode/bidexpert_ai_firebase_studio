/**
 * @fileoverview Tipos para Auctioneer (Leiloeiro) — Admin Plus.
 */
export interface AuctioneerRow {
  id: string;
  publicId: string;
  name: string;
  slug: string;
  description: string | null;
  registrationNumber: string | null;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  contactName: string | null;
  city: string | null;
  state: string | null;
  tenantId: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}
