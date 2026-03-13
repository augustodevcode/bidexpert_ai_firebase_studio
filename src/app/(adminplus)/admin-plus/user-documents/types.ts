/**
 * @fileoverview Tipo de linha para UserDocument — Admin Plus.
 */
export interface UserDocumentRow {
  id: string;
  status: string;
  fileName: string;
  fileUrl: string;
  rejectionReason: string;
  userId: string;
  userName: string;
  userEmail: string;
  documentTypeId: string;
  documentTypeName: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}
