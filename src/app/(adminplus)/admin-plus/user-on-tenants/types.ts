/**
 * @fileoverview Tipos serializados para UserOnTenant — Admin Plus.
 */
export interface UserOnTenantRow {
  /** Composite key string: "userId:tenantId" */
  compositeId: string;
  userId: string;
  tenantId: string;
  assignedAt: string;
  assignedBy: string | null;
  /** Joined fields */
  userName?: string;
  userEmail?: string;
  tenantName?: string;
}
