/**
 * @fileoverview Tipos da entidade Seller — Admin Plus.
 */
export interface SellerRow {
  id: string;
  publicId: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  contactName?: string | null;
  city?: string | null;
  state?: string | null;
  isJudicial: boolean;
  tenantId: string;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}
