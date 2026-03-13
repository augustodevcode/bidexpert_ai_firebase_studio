/**
 * @fileoverview Tipos para LotCategory — Admin Plus.
 */
export interface LotCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  megaMenuImageUrl: string;
  hasSubcategories: boolean;
  isGlobal: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}
