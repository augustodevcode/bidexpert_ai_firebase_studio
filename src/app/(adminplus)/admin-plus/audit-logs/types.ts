/**
 * Tipo de linha para AuditLog na DataTable.
 */
export interface AuditLogRow {
  id: string;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  action: string;
  changedFields: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}
