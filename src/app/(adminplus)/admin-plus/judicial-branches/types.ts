/**
 * @fileoverview Tipos de JudicialBranch — Admin Plus.
 */
export interface JudicialBranchRow {
  id: string;
  name: string;
  slug: string;
  districtId: string | null;
  districtName: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}
