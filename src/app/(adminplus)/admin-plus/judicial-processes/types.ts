/**
 * @fileoverview Tipos de JudicialProcess — Admin Plus.
 */
export interface JudicialProcessRow {
  id: string;
  publicId: string;
  processNumber: string;
  isElectronic: boolean;
  courtId: string | null;
  courtName: string | null;
  districtId: string | null;
  districtName: string | null;
  branchId: string | null;
  branchName: string | null;
  sellerId: string | null;
  sellerName: string | null;
  propertyMatricula: string | null;
  propertyRegistrationNumber: string | null;
  actionType: string | null;
  actionDescription: string | null;
  actionCnjCode: string | null;
  createdAt: string;
  updatedAt: string;
}
