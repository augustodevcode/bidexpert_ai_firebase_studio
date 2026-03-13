/**
 * Type definitions for LotRisk entity rows.
 */
export interface LotRiskRow {
  id: string;
  lotId: string;
  lotTitle: string;
  riskType: string;
  riskLevel: string;
  riskDescription: string;
  mitigationStrategy: string | null;
  verified: boolean;
  verifiedBy: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  createdAt: string;
}
