/**
 * @fileoverview Tipos de linha para JudicialDistrict — Admin Plus.
 */
export interface JudicialDistrictRow {
  id: string;
  name: string;
  slug: string;
  courtId?: string | null;
  courtName?: string | null;
  stateId?: string | null;
  stateName?: string | null;
  zipCode?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
