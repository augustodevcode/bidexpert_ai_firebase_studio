/**
 * @fileoverview Tipos para Subcategory — Admin Plus.
 */
export interface SubcategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentCategoryId: string;
  parentCategoryName: string;
  displayOrder: number;
  iconUrl: string;
  isGlobal: boolean;
  tenantId: string;
  createdAt?: string;
}
